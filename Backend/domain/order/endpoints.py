# domain/order/endpoints.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, NamedTuple # Use NamedTuple for simple dummy user type

from . import schemas, service as order_services # Alias to avoid naming conflict

# --- Core Dependencies ---
# Adjust these imports to match your project structure
try:
    # Function to get a database session
    from config.db import get_db
except ImportError:
    # Placeholder if get_db is defined elsewhere or for testing
    def get_db(): raise NotImplementedError("Database session dependency 'get_db' not configured.")

# --- !!! TEMPORARY DUMMY AUTHENTICATION !!! ---
# --- Replace this section with your actual authentication dependencies when ready ---

# Define a simple structure for our dummy user, just needs an 'id'
class DummyUser(NamedTuple):
    id: int
    # Add other fields like email if your code somewhere expects them, though not strictly needed here
    # email: str = "dummy.user@example.com"

# Define the dummy dependency function
async def get_dummy_current_user() -> DummyUser:
    """
    !!! DEVELOPMENT ONLY !!!
    Returns a hardcoded dummy user object.
    Replace with your actual JWT token verification dependency ('get_current_active_user').
    Make sure a user with id=1 exists in your 'users' database table.
    """
    print("WARNING: Using dummy authentication! Returning user with ID 1.")
    # Ensure User ID 1 exists in your 'users' table!
    return DummyUser(id=1)

# Type hint for dependency injection using our dummy user type
AuthUser = DummyUser
# Dependency function to use in endpoints
get_current_active_user = get_dummy_current_user

# --- End of Temporary Dummy Authentication Section ---


# --- Router Setup ---
router = APIRouter(
    tags=["Order & Delivery"] # Group endpoints in Swagger/OpenAPI docs
)

# --- Delivery Endpoint ---

@router.post(
    "/delivery",
    response_model=schemas.DeliveryRead,
    status_code=status.HTTP_201_CREATED,
    summary="Save Delivery Information (Dev Mode - User ID 1)",
    description="Saves delivery address information. **[Dev Mode] Currently hardcoded to use User ID 1.**",
)
def save_delivery_information(
    delivery_in: schemas.DeliveryCreate = Body(...), # Explicitly indicate body payload
    db: Session = Depends(get_db),
    # Use the DUMMY dependency here
    current_user: AuthUser = Depends(get_current_active_user)
):
    """
    Endpoint to save delivery information.
    **DEVELOPMENT NOTE:** User is currently hardcoded via `get_dummy_current_user`.
    """
    # The dummy dependency provides the user object with the hardcoded ID
    if not current_user or not hasattr(current_user, 'id'):
         # Should not happen with the dummy dependency unless modified
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Dummy user setup failed")

    # Delegate creation logic to the service layer, passing the hardcoded user ID
    delivery = order_services.delivery_service.create_delivery_info(
        db=db, delivery_in=delivery_in, user_id=current_user.id
    )
    return delivery


# --- Order Endpoint ---

@router.post(
    "/order",
    response_model=schemas.OrderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Place a New Order (Dev Mode - User ID 1)",
    description="Creates an order using cart items and delivery ID. **[Dev Mode] Currently hardcoded to use User ID 1.**",
)
def place_new_order(
    order_in: schemas.OrderCreate = Body(...), # Expects {"delivery_id": <id>} in body
    db: Session = Depends(get_db),
    # Use the DUMMY dependency here
    current_user: AuthUser = Depends(get_current_active_user)
):
    """
    Endpoint to create a final order.
    **DEVELOPMENT NOTE:** User is currently hardcoded via `get_dummy_current_user`.
    """
    if not current_user or not hasattr(current_user, 'id'):
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Dummy user setup failed")

    # Delegate complex order creation logic to the service layer
    order = order_services.order_service.place_order_from_cart(
        db=db, delivery_id=order_in.delivery_id, user_id=current_user.id
    )
    # Service layer handles exceptions (4xx, 5xx) and raises them
    return order


# --- Optional: Endpoints to view orders ---

@router.get(
    "/orders",
    response_model=List[schemas.OrderRead],
    summary="List Orders (Dev Mode - User ID 1)",
    description="Retrieves orders. **[Dev Mode] Currently hardcoded to use User ID 1.**",
)
def list_my_orders(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    # Use the DUMMY dependency here
    current_user: AuthUser = Depends(get_current_active_user)
):
    """
    Retrieves a paginated list of orders.
    **DEVELOPMENT NOTE:** User is currently hardcoded via `get_dummy_current_user`.
    """
    if not current_user or not hasattr(current_user, 'id'):
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Dummy user setup failed")

    orders = order_services.order_service.list_user_orders(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )
    return orders


@router.get(
    "/orders/{order_id}",
    response_model=schemas.OrderRead,
    summary="Get Order Details (Dev Mode - User ID 1)",
    description="Retrieves details of a specific order. **[Dev Mode] Checks ownership against User ID 1.**",
    responses={
        404: {"description": "Order not found or does not belong to User ID 1"},
        # Remove 401 for now as auth isn't really happening
    }
)
def get_order_details(
    order_id: int,
    db: Session = Depends(get_db),
    # Use the DUMMY dependency here
    current_user: AuthUser = Depends(get_current_active_user)
):
    """
    Retrieves details for a single order by its ID.
    **DEVELOPMENT NOTE:** Checks ownership against the hardcoded user ID from `get_dummy_current_user`.
    """
    if not current_user or not hasattr(current_user, 'id'):
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Dummy user setup failed")

    # Service layer handles the logic including the 404 check for not found/access denied (for the hardcoded user)
    order = order_services.order_service.get_order_details(
        db=db, order_id=order_id, user_id=current_user.id
    )
    return order