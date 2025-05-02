# File: backend/websocket_manager.py
import logging
from fastapi import WebSocket
from typing import List, Dict, Set

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store connections per "room" or topic, e.g., 'admin_notifications'
        # Using a set for faster additions/removals
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        logger.info("ConnectionManager initialized.")

    async def connect(self, websocket: WebSocket, room: str = "admin_notifications"):
        """Accepts a WebSocket connection and adds it to the specified room."""
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = set()
        self.active_connections[room].add(websocket)
        logger.info(f"WebSocket connected. Total in room '{room}': {len(self.active_connections[room])}")

    def disconnect(self, websocket: WebSocket, room: str = "admin_notifications"):
        """Removes a WebSocket connection from the specified room."""
        if room in self.active_connections:
            self.active_connections[room].discard(websocket) # Use discard to avoid errors if already removed
            logger.info(f"WebSocket disconnected. Remaining in room '{room}': {len(self.active_connections[room])}")
            if not self.active_connections[room]:
                del self.active_connections[room] # Clean up empty room
                logger.info(f"Room '{room}' is now empty and removed.")
        else:
            logger.warning(f"Attempted to disconnect WebSocket from non-existent or empty room '{room}'.")


    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Sends a message directly to a single WebSocket."""
        try:
            await websocket.send_text(message)
        except Exception as e:
            # This often happens if the client disconnected abruptly
            logger.warning(f"Failed to send personal message (client might have disconnected): {e}", exc_info=False)
            # Attempt to clean up the connection if sending failed
            # We need to know the room, which isn't directly available here.
            # This is a limitation; disconnect is typically called from the endpoint.


    async def broadcast(self, message: str, room: str = "admin_notifications"):
        """Broadcasts a message to all connected WebSockets in a specific room."""
        if room in self.active_connections:
            # Create a list to iterate over, as the set might change during iteration if disconnects happen
            connections_to_notify = list(self.active_connections[room])
            if not connections_to_notify:
                logger.debug(f"No active connections in room '{room}' to broadcast to.")
                return

            logger.info(f"Broadcasting to {len(connections_to_notify)} connections in room '{room}': {message[:100]}...") # Log truncated message

            # Use list comprehension for potential slight performance gain with asyncio.gather (though loop is often clearer)
            # for connection in connections_to_notify:
            #     try:
            #         await connection.send_text(message)
            #     except Exception as e:
            #         logger.error(f"Error broadcasting to a WebSocket: {e}. Connection might be closed.", exc_info=False)
            #         # Mark for removal or handle disconnection here if possible/needed
            #         # Note: Modifying the set while iterating can be tricky, hence iterating a list copy
            #         # self.disconnect(connection, room) # Careful with modifying during iteration

            # Alternative using gather (can be faster for many connections, but handles errors differently)
            import asyncio
            results = await asyncio.gather(
                *(connection.send_text(message) for connection in connections_to_notify),
                return_exceptions=True # Capture exceptions instead of raising them immediately
            )

            # Process results to find failed sends (and potentially disconnect those sockets)
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    failed_socket = connections_to_notify[i]
                    logger.error(f"Error broadcasting to a WebSocket: {result}. Removing connection.", exc_info=False)
                    # Disconnect the socket that caused the error
                    self.disconnect(failed_socket, room)
        else:
            logger.debug(f"Room '{room}' does not exist for broadcasting.")


# Create a single instance to be used across the application
# This instance will be shared between the endpoint and the consumer
# IF they run in the same process (as configured in docker-compose).
manager = ConnectionManager()