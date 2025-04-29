# File: domain/order/endpoints.py
import logging # Add logging
from fastapi import APIRouter, Depends, HTTPException, status # Added status
from sqlalchemy.orm import Session

# Use relative imports for files in the same directory/module
from .schemas import OrderCreate, OrderResponse
from .service import OrderService

# Import get_db - Check your project structure!
# If config is one level up from domain: from ..config.db import get_db
# If config is at the root and you run from root: from config.db import get_db (might work)
# Let's assume config is at the root for now, adjust if needed.
try:
    from config.db import get_db
except ImportError:
     # Fallback if config is one level up from domain
     from config.db import get_db


router = APIRouter(
    # Optional: Add prefix and tags here if specific to orders
    # prefix="/orders",
    tags=["Orders"] # Add tags for Swagger UI grouping
)

logger = logging.getLogger(__name__) # Get logger instance

# Make sure the path defined here matches how you include it in main.py
# If main.py includes with prefix="", this path needs to be /orders/
# If main.py includes with prefix="/orders", this path should be "/"
@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED) # Add status_code
def create_order_endpoint( # Renamed function slightly for clarity
    order_data: OrderCreate, # Renamed variable
    db: Session = Depends(get_db),
    # Inject service dependency (better practice)
    # order_service: OrderService = Depends(lambda db_session=Depends(get_db): OrderService(db_session)) # Option 1: Lambda dependency
    ):
    """
    Endpoint to create a new Cash on Delivery order.
    Accepts delivery information and calculated totals.
    """
    logger.info(f"Received request to create order: {order_data.dict(exclude={'delivery_info': {'email', 'phone'}})}") # Log safely

    # Option 2: Instantiate service inside endpoint (simpler for now)
    order_service = OrderService(db)

    try:
        created_order = order_service.create_order(order_data)
        logger.info(f"Order created successfully with ID: {created_order.id}")
        return created_order
    except Exception as e:
        logger.error(f"Error creating order: {e}", exc_info=True) # Log the full error
        # Provide a more generic error message to the client
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, # Or 500 if it's an internal server error
            detail=f"Could not process the order: {e}" # Include specific error detail for now, maybe remove in prod
        )