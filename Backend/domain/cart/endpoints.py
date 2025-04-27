# domain/cart/endpoints.py
from fastapi import APIRouter, Depends, HTTPException, status, Body, Path
from sqlalchemy.orm import Session
from typing import List
from config.db import get_db
from . import schemas # Import local schemas
from .service import CartService # Import the Cart Service
# Adjust import path for User model and JWT dependency as needed
from domain.authentication.models import User
from security.jwt import get_current_user

router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
    responses={
        401: {"description": "Unauthorized - Invalid or missing token"},
        404: {"description": "Not Found - Resource not found"},
        400: {"description": "Bad Request - Invalid input or stock issue"},
    },
    # Apply JWT authentication to all routes in this router
    dependencies=[Depends(get_current_user)]
)

# --- Dependency provider for the CartService ---
# This allows FastAPI to manage the service instance per request
def get_cart_service() -> CartService:
    # If CartService itself had dependencies, they could be injected here too
    # For now, we assume CartService() can instantiate its own repos or they are singletons
    return CartService()
# ---

@router.get(
    "/",
    response_model=schemas.CartOut,
    summary="Get current user's cart",
    description="Retrieves all items, quantities, and potentially totals for the logged-in user's shopping cart.",
)
def get_user_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service) # Inject service
):
    """
    Fetches the complete cart content for the authenticated user from the database.
    """
    try:
        return cart_service.get_cart(db=db, user_id=current_user.id)
    except Exception as e:
         # Catch unexpected errors during fetch
        print(f"ERROR:get_user_cart: User {current_user.id}, Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching the cart."
        )

@router.post(
    "/",
    response_model=schemas.CartItemOut,
    status_code=status.HTTP_200_OK, # OK for add-or-update is fine
    summary="Add item or update quantity in cart",
    description="Adds a specified quantity of a product to the cart. If the product exists, quantity is added. Validates against stock.",
)
def add_or_update_cart_item(
    item_data: schemas.CartItemCreate = Body(..., example={"prod_id": 1, "quantity": 1}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """
    Handles adding/updating cart items:
    - Checks product existence and available stock via the service layer.
    - If item exists, increases quantity; otherwise, adds the item.
    - Returns the final state of the added/updated cart item.
    """
    try:
        cart_item = cart_service.add_or_update_item(
            db=db, user_id=current_user.id, item_data=item_data
        )
        return cart_item # Service returns the CartItemOut schema directly
    except HTTPException as http_exc:
        # Re-raise specific HTTP exceptions (e.g., 400 Bad Request, 404 Not Found)
        # raised by the service layer (e.g., stock issues, product not found)
        raise http_exc
    except Exception as e:
        # Catch unexpected errors during the process
        print(f"ERROR:add_or_update_cart_item: User {current_user.id}, Product {item_data.prod_id}, Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating the cart."
        )


@router.delete(
    "/{prod_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove specific item from cart",
    description="Removes a specific product entirely from the logged-in user's cart.",
    responses={
        204: {"description": "Item successfully removed from cart"},
        404: {"description": "Item not found in cart"},
    }
)
def remove_cart_item(
    prod_id: int = Path(..., description="ID of the product to remove from the cart", gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """
    Deletes one product entry from the user's cart based on the product ID.
    Returns No Content on success.
    """
    try:
        cart_service.remove_item(db=db, user_id=current_user.id, prod_id=prod_id)
        # No body needed for 204 response, return None
        return None
    except HTTPException as http_exc:
        # Re-raise 404 if service indicated item not found
        raise http_exc
    except Exception as e:
        print(f"ERROR:remove_cart_item: User {current_user.id}, Product {prod_id}, Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while removing the item from the cart."
        )


@router.delete(
    "/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear user's entire cart",
    description="Removes all items from the logged-in user's shopping cart.",
    responses={
        204: {"description": "Cart successfully cleared"},
    }
)
def clear_user_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """
    Empties the entire shopping cart for the currently authenticated user.
    Returns No Content on success.
    """
    try:
        deleted_count = cart_service.clear_cart(db=db, user_id=current_user.id)
        print(f"INFO: Cart cleared for user {current_user.id}. Items removed: {deleted_count}") # Optional log
        return None # Return None for 204 response
    except Exception as e:
        print(f"ERROR:clear_user_cart: User {current_user.id}, Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while clearing the cart."
        )