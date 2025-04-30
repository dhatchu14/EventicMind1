# File: domain/order/endpoints.py
print("✅ Loaded domain.order.endpoints router")
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel # <-- Import BaseModel

# Use relative imports
from .schemas import OrderCreate, OrderResponse
from .service import OrderService
from .models import Order # <-- Import your Order SQLAlchemy model (adjust path if needed)

# --- IMPORTANT: Import your ACTUAL authentication dependencies ---
# Replace these placeholders with your correct paths and function names
try:
    from ..authentication.models import User as AuthUser  # Real User model
    from security.jwt import get_current_user           # Function you need
except ImportError as e:
    raise ImportError("Failed to import authentication dependencies. Make sure paths are correct.") from e

# --------------------------------------------------------------

# Import get_db - Adjust path if needed
try:
    from config.db import get_db
except ImportError:
     from ...config.db import get_db # Adjust relative path if needed (e.g., if config is higher up)


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

logger = logging.getLogger(__name__)

# Define valid statuses (mirroring frontend, ideally centralize this list)
# Keep this consistent with the `value` fields in your frontend's ORDER_STATUSES
ORDER_STATUSES_VALUES = [
    'pending',
    'pending_cod',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
]

# --- Pydantic Model for the PATCH Request Body ---
class OrderStatusUpdatePayload(BaseModel):
    status: str

# --- Endpoint to CREATE an order ---
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
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
        return created_order_model
    except ValueError as ve:
        logger.error(f"Value error creating order for user {current_user.id}: {ve}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error creating order for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not process the order due to an internal error.")

# --- Endpoint to GET order history for the current user ---
@router.get("/", response_model=List[OrderResponse], status_code=status.HTTP_200_OK)
def get_order_history_endpoint(
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
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

# --- Endpoint to UPDATE order status (Admin Only) ---
@router.patch("/{order_id}", response_model=OrderResponse, status_code=status.HTTP_200_OK)
def update_order_status_endpoint(
    order_id: int,
    payload: OrderStatusUpdatePayload,
    db: Session = Depends(get_db)
):
    """
    Endpoint to update the status of a specific order.
    """
    logger.info(f"Received PATCH /orders/{order_id} request.")

    # --- Fetch the Order ---
    db_order = db.query(Order).filter(Order.id == order_id).first()

    if db_order is None:
        logger.warning(f"Order with ID {order_id} not found during PATCH request.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )

    # --- Update the Order Status ---
    db_order.status = payload.status  # assuming 'status' is part of the payload

    # Commit the changes to the database
    db.commit()
    db.refresh(db_order)

    logger.info(f"Successfully updated status for order ID {order_id}.")

    # Return the updated order response
    return db_order
# Remember to include this router in your main FastAPI application instance (main.py)
# Example: app.include_router(router)
# Example: app.include_router(router)
@router.get("/admin/all", response_model=List[OrderResponse], status_code=status.HTTP_200_OK)
def get_all_orders_admin(db: Session = Depends(get_db)):
    """
    Public endpoint to fetch all orders in the system (authentication removed).
    """
    logger.info("Request received to fetch all orders (no auth).")

    try:
        orders = db.query(Order).all()
        logger.info(f"Returning {len(orders)} orders")
        return orders
    except Exception as e:
        logger.error(f"Error retrieving all orders: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve orders due to a server error."
        )
