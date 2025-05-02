# File: backend/run_consumer.py
import os
import json
import logging
import time
import asyncio # Import asyncio
from confluent_kafka import Consumer, KafkaError, KafkaException

# --- IMPORTANT ---
# This import assumes 'run_consumer.py' and 'websocket_manager.py'
# are structured such that this relative import works within the container.
# If they are in different directories, adjust the import path accordingly.
# Example: from .websocket_manager import manager (if in same directory)
# Example: from ..websocket_manager import manager (if websocket_manager is one level up)
# Check your '/app' directory structure inside the container.
try:
    # Adjust this path based on where websocket_manager.py is relative to run_consumer.py
    from websocket_manager import manager
except ImportError:
    logging.critical("Failed to import 'manager' from 'websocket_manager'. Check the path and Python's import resolution.")
    raise

# --- Logging Configuration ---
log_level_str = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level_str, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("KafkaOrderConsumer")

# --- Kafka Configuration ---
# Use environment variables with sensible defaults
KAFKA_BROKER = os.environ.get("KAFKA_BROKER", "kafka:9092")
# Topic name based on Debezium config: <topic.prefix>.<schema>.<table>
KAFKA_TOPIC = os.environ.get("KAFKA_ORDER_TOPIC", "eventicmind.public.orders")
KAFKA_GROUP_ID = os.environ.get("KAFKA_GROUP_ID", "order-notifications-group") # Consumer group

async def process_message(msg):
    """Processes a single Kafka message."""
    try:
        message_value = msg.value().decode('utf-8')
        logger.debug(f"Received raw message: {message_value[:200]}...") # Log truncated message
        data = json.loads(message_value)

        # --- Debezium Message Structure Parsing ---
        payload = data.get('payload')
        if not payload:
            logger.warning("Received message without 'payload' field. Structure might be unexpected or not a Debezium message.")
            return

        operation = payload.get('op') # 'c' for create, 'u' for update, 'd' for delete, 'r' for read (snapshot)
        source_info = payload.get('source')
        db_name = source_info.get('db') if source_info else 'N/A'
        table_name = source_info.get('table') if source_info else 'N/A'
        ts_ms = payload.get('ts_ms') # Timestamp of the event

        # --- Filter for NEW Order Creations ---
        if operation == 'c' and table_name == 'orders': # Check table name for safety
            order_data = payload.get('after') # 'after' contains the state of the row *after* the CREATE operation
            if order_data:
                order_id = order_data.get('id')
                user_id = order_data.get('user_id') # Make sure this field exists in your 'orders' table
                total = order_data.get('total')
                status = order_data.get('status')
                # created_at = order_data.get('created_at') # Optional: Debezium timestamps might differ

                if order_id is None or user_id is None:
                     logger.warning(f"Create operation for table '{table_name}' missing 'id' or 'user_id' in 'after' payload.")
                     return

                logger.info(f"Detected NEW order creation: ID={order_id}, UserID={user_id}, Total={total}, Status={status}, DB={db_name}, Table={table_name}")

                # --- Prepare Notification for WebSocket ---
                notification = {
                    "type": "new_order", # Message type identifier for the frontend
                    "order_id": order_id,
                    "user_id": user_id,
                    "total": total,
                    "status": status,
                    "timestamp": time.time() # Use current time or parse ts_ms/created_at if needed
                }
                notification_json = json.dumps(notification)

                # --- Broadcast via WebSocket Manager ---
                # manager is the shared instance imported from websocket_manager.py
                await manager.broadcast(notification_json, room="admin_notifications")
                logger.info(f"Broadcasted notification for new order {order_id}")

            else:
                 logger.warning("Create operation received but 'after' payload is missing or empty.")
        else:
            # Log other operations if needed for debugging, but less frequently
            if operation != 'r': # Snapshot reads ('r') can be very noisy
                logger.debug(f"Ignoring non-create operation ('{operation}') or irrelevant table ('{table_name}')")

    except json.JSONDecodeError:
        logger.error(f"Failed to decode JSON message: {msg.value().decode('utf-8')[:200]}...")
    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        # Decide if you want to stop the consumer on processing errors

async def run_consumer():
    """Main function to run the Kafka consumer loop."""
    logger.info(f"Starting Kafka Consumer:")
    logger.info(f"  Broker: {KAFKA_BROKER}")
    logger.info(f"  Topic: {KAFKA_TOPIC}")
    logger.info(f"  Group ID: {KAFKA_GROUP_ID}")

    conf = {
        'bootstrap.servers': KAFKA_BROKER,
        'group.id': KAFKA_GROUP_ID,
        'auto.offset.reset': 'earliest',  # Start reading from the beginning if no offset stored for the group
        'enable.auto.commit': True,       # Commit offsets automatically (simplest, but can lead to message loss/duplicates on crash)
        # 'enable.auto.commit': False,    # For manual commit (more reliable) - requires consumer.commit() call
        'enable.partition.eof': False,    # Continue consuming even if partition EOF is reached (important for continuous streams)
        # Add other configurations like security (SASL/SSL) if needed
        # 'security.protocol': 'SASL_SSL',
        # 'sasl.mechanisms': 'PLAIN',
        # 'sasl.username': 'your_username',
        # 'sasl.password': 'your_password',
    }

    consumer = None
    try:
        consumer = Consumer(conf)
        consumer.subscribe([KAFKA_TOPIC])
        logger.info(f"Successfully subscribed to topic: {KAFKA_TOPIC}")

        while True: # Keep running indefinitely
            msg = consumer.poll(timeout=1.0) # Poll for new messages every 1 second

            if msg is None:
                # No message received in this poll interval
                await asyncio.sleep(0.1) # Small sleep to prevent tight loop when idle
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    # End of partition event (not an error for continuous consumption)
                    # logger.debug(f"Reached end of partition: {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")
                    continue
                elif msg.error().fatal():
                    # Fatal error - Cannot recover
                    logger.critical(f"FATAL Kafka Consumer error: {msg.error()}. Exiting.")
                    raise KafkaException(msg.error())
                else:
                    # Non-fatal error
                    logger.error(f"Kafka Consumer error: {msg.error()}")
                    # Consider adding retry logic or specific error handling here
                    await asyncio.sleep(5) # Wait before retrying poll after an error
            else:
                # Proper message received - process it asynchronously
                await process_message(msg)
                # If using manual commit:
                # try:
                #     consumer.commit(message=msg, asynchronous=True) # Async commit is usually fine
                # except Exception as commit_err:
                #     logger.error(f"Failed to commit offset for message: {commit_err}", exc_info=True)


    except KafkaException as e:
         logger.critical(f"KafkaException occurred: {e}", exc_info=True)
         # Handle critical Kafka errors (e.g., configuration, broker connection)
    except KeyboardInterrupt:
        logger.info("Consumer interrupted by user (KeyboardInterrupt). Shutting down...")
    except Exception as e:
         logger.critical(f"Unhandled exception in consumer loop: {e}", exc_info=True)
    finally:
        # Close down consumer cleanly
        if consumer:
            logger.info("Closing Kafka consumer...")
            consumer.close()
            logger.info("Kafka consumer closed.")

if __name__ == "__main__":
    try:
        asyncio.run(run_consumer())
    except Exception as e:
        # Catch errors during startup or critical failures from run_consumer
        logger.critical(f"Consumer process failed to run or exited critically: {e}", exc_info=True)
        # Optional: exit with non-zero code for orchestration tools
        import sys
        sys.exit(1)