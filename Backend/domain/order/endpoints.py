# File: domain/order/endpoints.py
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List # <-- Import List

# Use relative imports
from .schemas import OrderCreate, OrderResponse
from .service import OrderService

# --- IMPORTANT: Import your ACTUAL authentication dependencies ---
# Replace these placeholders with your correct paths and function names
try:
    # Assuming auth stuff is in a sibling 'authentication' directory
    from ..authentication.service import get_current_active_user
    from ..authentication.models import User # Replace with your actual User model import
except ImportError:
    # Fallback or error if structure is different
    # Dummy placeholders - REMOVE/REPLACE these in your actual code
    print("WARNING: Using placeholder auth dependencies. Replace with actual implementation.")
    User = type("User", (), {"id": 1, "email": "placeholder@example.com"}) # Dummy User type
    def get_current_active_user(): # Dummy dependency
        print("WARNING: Using placeholder get_current_active_user dependency.")
        return User()
# --------------------------------------------------------------

# Import get_db - Adjust path if needed
try:
    from config.db import get_db
except ImportError:
     from config.db import get_db # Try relative path if config is one level up

router = APIRouter(
    # Setting prefix here simplifies endpoint paths below
    prefix="/orders",
    tags=["Orders"]
)

logger = logging.getLogger(__name__)

# --- Endpoint to CREATE an order ---
# Path is now "/" relative to the "/orders" prefix
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    # Inject dependency to get the logged-in user
    current_user: User = Depends(get_current_active_user)
):
    """Endpoint to create a new Cash on Delivery order for the authenticated user."""
    logger.info(f"Received POST /orders request from user_id={current_user.id}")
    order_service = OrderService(db)
    try:
        # Pass user_id to the service method
        created_order_model = order_service.create_order(
            order_data=order_data,
            user_id=current_user.id
        )
        logger.info(f"Order {created_order_model.id} created successfully for user {current_user.id}")
        # FastAPI converts the returned SQLAlchemy model using the schema's Config
        return created_order_model
    except ValueError as ve: # Catch specific logical errors from service/repo
        logger.error(f"Value error creating order for user {current_user.id}: {ve}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error creating order for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not process the order due to an internal error.")


# --- ADDED: Endpoint to GET order history ---
# Path is now "/" relative to the "/orders" prefix
@router.get("/", response_model=List[OrderResponse], status_code=status.HTTP_200_OK)
def get_order_history_endpoint(
    db: Session = Depends(get_db),
    # Inject dependency to get the logged-in user
    current_user: User = Depends(get_current_active_user)
):
    """Endpoint to fetch the order history for the currently authenticated user."""
    logger.info(f"Received GET /orders request for user_id={current_user.id}")
    order_service = OrderService(db)
    try:
        # Call the service method to get order history for the user
        order_history_models = order_service.get_order_history(user_id=current_user.id)
        logger.info(f"Returning {len(order_history_models)} orders for user {current_user.id}")
        # FastAPI converts the list of SQLAlchemy models using the schema's Config
        return order_history_models
    except Exception as e:
        logger.error(f"Error fetching order history for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while fetching order history."
        )
# -----------------------------------------