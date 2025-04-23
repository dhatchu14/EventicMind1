# domain/cart/endpoints.py
from fastapi import APIRouter, Depends, HTTPException, status, Body, Path
from sqlalchemy.orm import Session
from typing import List
from config.db import get_db
from . import schemas, service as cart_svc
from domain.authentication.models import User # For type hinting current_user
# Import your JWT dependency
from security.jwt import get_current_user # Adjust import path

router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Not Found"},
    },
    # Apply authentication dependency to all routes in this router
    dependencies=[Depends(get_current_user)]
)

# Dependency for the service instance
def get_cart_service() -> cart_svc.CartService:
    return cart_svc.cart_service

@router.get(
    "/",
    response_model=schemas.CartOut,
    summary="Get current user's cart",
)
def get_user_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: cart_svc.CartService = Depends(get_cart_service)
):
    """Retrieves all items currently in the logged-in user's cart."""
    return cart_service.get_cart(db=db, user_id=current_user.id)


@router.post(
    "/",
    response_model=schemas.CartItemOut,
    status_code=status.HTTP_200_OK, # Or 201 if you always treat it as creation? 200 is safer for upsert.
    summary="Add or Update item in cart",
)
def add_or_update_cart_item(
    item_data: schemas.CartItemCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: cart_svc.CartService = Depends(get_cart_service)
):
    """
    Adds a specified quantity of a product to the cart.
    If the product is already in the cart, the quantity is added to the existing amount.
    Validates against available inventory stock.
    """
    try:
        cart_item = cart_service.add_or_update_item(
            db=db, user_id=current_user.id, item_data=item_data
        )
        return cart_item
    except HTTPException as e:
        # Re-raise specific HTTP exceptions (like 400 for stock, 404 for product)
        raise e
    except Exception as e:
        # Catch unexpected errors
        print(f"Error adding/updating cart item for user {current_user.id}, product {item_data.prod_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error processing cart item.")


@router.delete(
    "/{prod_id}",
    status_code=status.HTTP_204_NO_CONTENT, # Standard for successful DELETE with no body
    summary="Remove item from cart",
)
def remove_cart_item(
    prod_id: int = Path(..., description="ID of the product to remove from the cart", gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: cart_svc.CartService = Depends(get_cart_service)
):
    """Removes a specific product entirely from the user's cart."""
    try:
        cart_service.remove_item(db=db, user_id=current_user.id, prod_id=prod_id)
        # No content to return on success
        return None # FastAPI handles the 204 response
    except HTTPException as e:
        # Re-raise specific HTTP exceptions (like 404 for item not found)
        raise e
    except Exception as e:
        # Catch unexpected errors
        print(f"Error removing cart item for user {current_user.id}, product {prod_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error removing cart item.")


# Optional: Endpoint to clear the entire cart
@router.delete(
    "/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear user's entire cart"
)
def clear_user_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: cart_svc.CartService = Depends(get_cart_service)
):
    """Removes all items from the logged-in user's cart."""
    try:
        deleted_count = cart_service.clear_cart(db=db, user_id=current_user.id)
        print(f"Cleared {deleted_count} items for user {current_user.id}")
        return None
    except Exception as e:
        print(f"Error clearing cart for user {current_user.id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error clearing cart.")