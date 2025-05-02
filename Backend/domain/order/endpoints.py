# File: domain/order/endpoints.py
# --- Start of File ---

print("✅ Loaded domain.order.endpoints router") # Keep this for confirmation during startup
import logging
import asyncio
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Query, # Query is needed if you ever re-add token auth via query param
    status,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session

# --- CORRECTLY IMPORT YOUR SHARED ConnectionManager INSTANCE ---
# Try absolute import first (usually better in Docker context where WORKDIR is /app)
try:
    # Assumes 'Backend' maps to the root package directory '/app' in Docker
    from websocket_manager import manager as ws_manager
    logging.info("✅ Successfully imported shared 'ws_manager' instance using absolute path.")
except ImportError:
    # Fallback: Try relative import (go up 3 levels: order -> domain -> Backend)
    try:
        from ...websocket_manager import manager as ws_manager # Go up from order -> domain -> Backend
        logging.info("✅ Successfully imported shared 'ws_manager' instance using relative path (...).")
    except ImportError as e:
         logging.critical("❌ FAILED to import shared 'ws_manager' instance from websocket_manager.py using absolute or relative paths. WebSocket notifications will NOT work. Check import paths.", exc_info=True)
         # Create a dummy manager to prevent NameErrors during startup, but WS won't function.
         class DummyWsManager:
             async def connect(self, *args, **kwargs): logging.warning("Using DummyWsManager: connect called")
             def disconnect(self, *args, **kwargs): logging.warning("Using DummyWsManager: disconnect called")
             async def send_personal_message(self, *args, **kwargs): logging.warning("Using DummyWsManager: send_personal_message called")
             async def broadcast(self, *args, **kwargs): logging.warning("Using DummyWsManager: broadcast called")
             active_connections = {}
         ws_manager = DummyWsManager()

# --- Domain Specific Imports ---
from .schemas import OrderCreate, OrderResponse # Assuming OrderStatusUpdatePayload is defined below or in schemas.py
from .service import OrderService
from .models import Order

# --- Authentication Imports (Keep as per your setup) ---
try:
    from ..authentication.models import User as AuthUser
    from security.jwt import get_current_user
    # from security.jwt import get_current_user_from_token # Keep if you re-add token auth
except ImportError as e:
    # Log the error but allow startup, other endpoints might work
    logging.error(f"⚠️ Failed to import authentication dependencies: {e}. Auth-related endpoints might fail.")
    # Define dummy dependencies if needed to prevent NameErrors at route definition time
    async def get_current_user(): raise HTTPException(status_code=500, detail="Auth dependency missing")

# --- Database Import ---
try:
    # Assumes config is a top-level directory or accessible from WORKDIR
    from config.db import get_db
except ImportError:
     try:
        # Relative path if config is higher up than domain
        from ...config.db import get_db
     except ImportError:
        logging.critical("❌ FAILED to import get_db from config.db. Database connections will fail.")
        async def get_db(): raise HTTPException(status_code=500, detail="DB dependency missing")


# --- Router Setup ---
router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

# --- Logger ---
# Get the logger *after* potential initial logging during imports
logger = logging.getLogger(__name__)

# --- Define valid statuses (optional, for validation) ---
ORDER_STATUSES_VALUES = [
    'pending', 'pending_cod', 'processing', 'shipped', 'delivered', 'cancelled',
]

# --- Pydantic Model for PATCH Request Body ---
# Define it here if not in schemas.py
class OrderStatusUpdatePayload(BaseModel):
    status: str

# =========================================
# === HTTP Endpoints ======================
# =========================================

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user) # Requires working auth import
):
    """Endpoint to create a new order for the authenticated user."""
    logger.info(f"Received POST /orders request from user_id={current_user.id}")
    order_service = OrderService(db)
    try:
        created_order_model = order_service.create_order(
            order_data=order_data,
            user_id=current_user.id
        )
        logger.info(f"Order {created_order_model.id} created successfully for user {current_user.id}")
        # --- Trigger WebSocket broadcast upon new order ---
        # Important: Ensure the consumer isn't ALSO broadcasting for the same event
        # if you enable this here. Choose one source of truth.
        # Consider moving broadcast logic to the service layer after commit.
        # try:
        #    notification = {
        #        "type": "new_order",
        #        "order_id": created_order_model.id,
        #        "user_id": created_order_model.user_id,
        #        "total": float(created_order_model.total), # Ensure serializable
        #        "status": created_order_model.status,
        #        # "timestamp": created_order_model.created_at.isoformat() # Example
        #    }
        #    # Schedule the broadcast to run in the background
        #    asyncio.create_task(ws_manager.broadcast(json.dumps(notification), room="admin_notifications"))
        #    logger.info(f"Scheduled WebSocket broadcast for new order {created_order_model.id}")
        # except Exception as broadcast_err:
        #      logger.error(f"Failed to schedule WebSocket broadcast for order {created_order_model.id}: {broadcast_err}", exc_info=True)
        return created_order_model
    except ValueError as ve:
        logger.error(f"Value error creating order for user {current_user.id}: {ve}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error creating order for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not process the order due to an internal error.")


@router.get("/", response_model=List[OrderResponse], status_code=status.HTTP_200_OK)
def get_order_history_endpoint(
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user) # Requires working auth import
):
    """Endpoint to fetch the order history for the currently authenticated user."""
    logger.info(f"Received GET /orders request for user_id={current_user.id}")
    order_service = OrderService(db)
    try:
        order_history_models = order_service.get_order_history(user_id=current_user.id)
        logger.info(f"Returning {len(order_history_models)} orders for user {current_user.id}")
        return order_history_models
    except Exception as e:
        logger.error(f"Error fetching order history for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while fetching order history."
        )


@router.patch("/{order_id}", response_model=OrderResponse, status_code=status.HTTP_200_OK)
def update_order_status_endpoint(
    order_id: int,
    payload: OrderStatusUpdatePayload,
    db: Session = Depends(get_db),
    # NOTE: Add admin role check dependency here if this should be admin-only
    # current_admin: AuthUser = Depends(get_admin_user) # Example dependency
):
    """
    Endpoint to update the status of a specific order.
    Requires appropriate authorization (e.g., Admin role).
    """
    # Example authorization check (requires get_admin_user dependency):
    # if not current_admin or current_admin.role != 'admin':
    #    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator privileges required.")

    new_status = payload.status.lower().strip()
    logger.info(f"Received PATCH /orders/{order_id} request to set status='{new_status}'.")

    # --- Validate Status ---
    if new_status not in ORDER_STATUSES_VALUES:
       logger.warning(f"Invalid status value '{new_status}' received for order {order_id}.")
       raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status value provided: {payload.status}")

    # --- Fetch the Order ---
    db_order = db.query(Order).filter(Order.id == order_id).first()

    if db_order is None:
        logger.warning(f"Order with ID {order_id} not found during PATCH request.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )

    # --- Update the Order Status ---
    original_status = db_order.status
    if original_status == new_status:
        logger.info(f"Order {order_id} status is already '{new_status}'. No update performed.")
        return db_order # Return current state if no change

    db_order.status = new_status

    try:
        db.commit()
        db.refresh(db_order)
        logger.info(f"Successfully updated status for order ID {order_id} from '{original_status}' to '{db_order.status}'.")
        # --- Optional: Broadcast status update ---
        # import json
        # try:
        #    notification = {
        #        "type": "order_status_update", # Different type for status changes
        #        "order_id": db_order.id,
        #        "new_status": db_order.status,
        #        "old_status": original_status
        #    }
        #    asyncio.create_task(ws_manager.broadcast(json.dumps(notification), room="admin_notifications"))
        #    logger.info(f"Scheduled WebSocket broadcast for status update on order {db_order.id}")
        # except Exception as broadcast_err:
        #      logger.error(f"Failed to schedule WebSocket broadcast for status update on order {db_order.id}: {broadcast_err}", exc_info=True)
        return db_order
    except Exception as e:
        logger.error(f"Database error updating status for order ID {order_id}: {e}", exc_info=True)
        db.rollback() # Rollback on error
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during status update.")


@router.get("/admin/all", response_model=List[OrderResponse], status_code=status.HTTP_200_OK)
def get_all_orders_admin(
    db: Session = Depends(get_db),
    # NOTE: Add admin role check dependency here if this should be admin-only
    # current_admin: AuthUser = Depends(get_admin_user) # Example dependency
):
    """
    Public endpoint to fetch all orders in the system.
    Consider adding admin authorization check.
    """
    # Example authorization check:
    # if not current_admin or current_admin.role != 'admin':
    #    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator privileges required.")

    logger.info("Request received for GET /orders/admin/all.")
    try:
        # Consider adding pagination for large number of orders
        orders = db.query(Order).order_by(Order.created_at.desc()).all()
        logger.info(f"Returning {len(orders)} orders from /admin/all.")
        return orders
    except Exception as e:
        logger.error(f"Error retrieving all orders from /admin/all: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve orders due to a server error."
        )

# =========================================
# === WebSocket Endpoint ==================
# =========================================

@router.websocket("/ws/admin/notifications")
async def websocket_admin_notifications(websocket: WebSocket):
    """
    Public WebSocket endpoint for admin notifications.
    Manages connection and sends periodic pings for keep-alive.
    Relies on external triggers (e.g., Kafka consumer via Redis Pub/Sub or direct API calls)
    calling ws_manager.broadcast to send data to connected clients.
    """
    client_host = websocket.client.host if websocket.client else "unknown"
    client_port = websocket.client.port if websocket.client else "unknown"
    logger.info(f"Admin WebSocket connection request from {client_host}:{client_port}")

    # Use the correctly imported WebSocket manager instance (ws_manager)
    room = "admin_notifications"
    await ws_manager.connect(websocket, room)
    logger.info(f"Admin WebSocket connected (public) from {client_host}:{client_port}. Current connections in room '{room}': {len(ws_manager.active_connections.get(room, set()))}")

    try:
        # Optional: Send a confirmation message to the newly connected client
        # await ws_manager.send_personal_message('{"type": "status", "message": "Connection established"}', websocket)

        last_ping = asyncio.get_event_loop().time()
        ping_interval = 30 # Send ping every 30 seconds

        while True:
            # --- Send Periodic Pings ---
            now = asyncio.get_event_loop().time()
            if now - last_ping > ping_interval:
                try:
                    # Send a simple ping message
                    await websocket.send_text('{"type": "ping"}')
                    logger.debug(f"Sent ping to client {client_host}:{client_port}")
                    last_ping = now
                except Exception as ping_err:
                    # Log warning, break loop as connection is likely dead
                    logger.warning(f"Failed to send ping to client {client_host}:{client_port}: {ping_err}. Closing connection.")
                    break # Exit the loop, finally block will handle disconnect

            # --- Efficiently Wait/Yield Control ---
            # Sleep allows other asyncio tasks to run. Important for responsiveness.
            await asyncio.sleep(1) # Yield control for 1 second

    except WebSocketDisconnect as e:
        # Catches disconnects initiated by the client or network issues detected during send/receive
        logger.info(f"Admin WebSocket {client_host}:{client_port} disconnected: code={e.code}, reason='{e.reason}'")
    except Exception as e:
        # Catch unexpected errors within the WebSocket handler loop
        logger.error(f"Unexpected error in admin WebSocket handler for {client_host}:{client_port}: {e}", exc_info=True)
        # Attempt to close the WebSocket connection gracefully if possible
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Internal server error")
        except Exception as close_err:
            # Log error during close attempt but proceed to finally block
            logger.error(f"Error attempting to close WebSocket after error for {client_host}:{client_port}: {close_err}")
    finally:
        # --- Ensure disconnection from the manager in all cases ---
        ws_manager.disconnect(websocket, room)
        logger.info(f"Cleaned up connection for admin WebSocket {client_host}:{client_port} from room '{room}'. Remaining connections: {len(ws_manager.active_connections.get(room, set()))}")

# Remember to include this router in your main FastAPI application (main.py)
# Example: app.include_router(router)

# --- End of File ---