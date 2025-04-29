# domain/cart/endpoints.py
from fastapi import APIRouter, Depends, HTTPException, status, Body, Path
from sqlalchemy.orm import Session
from typing import List

# Local imports
from . import schemas
from .service import CartService

# Core dependencies
from config.db import get_db

# Auth dependencies
from domain.authentication.models import User
from security.jwt import get_current_user # Assuming path is correct

# Router setup (prefix added in main.py)
router = APIRouter(
    tags=["Cart"],
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Not Found"},
        400: {"description": "Bad Request"},
        500: {"description": "Internal Server Error"}, # Added 500 default
    },
    dependencies=[Depends(get_current_user)] # Apply auth to all cart routes
)

# --- Dependency for CartService ---
def get_cart_service() -> CartService:
    """Provides a CartService instance."""
    # Could potentially initialize with specific repo instances if needed later
    return CartService()
# ---

@router.get(
    "/",
    response_model=schemas.CartOut,
    summary="Get current user's cart",
    description="Retrieves all items, quantities, and product details for the logged-in user's cart.",
)
def get_user_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """ Fetches the complete cart content for the authenticated user. """
    try:
        cart_data = cart_service.get_cart(db=db, user_id=current_user.id)
        return cart_data
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions from the service/repo
        raise http_exc
    except Exception as e:
        # Catch unexpected errors during the process
        print(f"API ERROR: get_user_cart: User {current_user.id}, Error: {e}")
        # Log the full traceback here in a real application
        # import traceback
        # traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching the cart. Please try again later.",
            # Avoid exposing raw error details like 'e' to the client
        )

@router.post(
    "/",
    response_model=schemas.CartItemOut,
    status_code=status.HTTP_200_OK, # 200 OK often preferred for add/update combo
    summary="Add item or increase quantity",
    description="Adds product to cart or increases quantity if it exists. Validates against stock.",
)
def add_or_update_cart_item(
    item_data: schemas.CartItemCreate = Body(..., example={"prod_id": 1, "quantity": 1}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """ Adds item or increments quantity. Returns the updated cart item state. """
    try:
        cart_item = cart_service.add_or_update_item(
            db=db, user_id=current_user.id, item_data=item_data
        )
        return cart_item
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"API ERROR: add_or_update_cart_item: User {current_user.id}, Data: {item_data}, Error: {e}")
        # traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating the cart.",
        )

@router.put(
    "/{prod_id}",
    response_model=schemas.CartItemOut,
    summary="Set specific quantity for an item",
    description="Sets the quantity of an *existing* cart item to a specific positive value. Validates against stock. Use DELETE to remove.",
    responses={
        404: {"description": "Product not found in cart"},
        400: {"description": "Invalid quantity (e.g., <= 0) or insufficient stock"},
    }
)
def set_cart_item_quantity(
    prod_id: int = Path(..., description="ID of the product in the cart", gt=0),
    item_update: schemas.CartItemUpdate = Body(..., example={"quantity": 3}, description="Object containing the desired new quantity"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """ Sets the quantity for a specific item in the cart. Quantity must be > 0. """
    try:
        # Pass the quantity directly from the validated schema
        updated_item = cart_service.set_item_quantity(
            db=db, user_id=current_user.id, prod_id=prod_id, quantity=item_update.quantity
        )
        return updated_item
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"API ERROR: set_cart_item_quantity: User {current_user.id}, Prod {prod_id}, Qty {item_update.quantity}, Error: {e}")
        # traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while setting item quantity.",
        )

@router.delete(
    "/{prod_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove specific item from cart",
    description="Removes a specific product entirely from the cart.",
    responses={
        404: {"description": "Item not found in cart"},
        204: {"description": "Item successfully removed"},
    }
)
def remove_cart_item(
    prod_id: int = Path(..., description="ID of the product to remove", gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """ Deletes one specific product entry from the user's cart. """
    try:
        cart_service.remove_item(db=db, user_id=current_user.id, prod_id=prod_id)
        # Return None automatically sends 204 No Content
        return None
    except HTTPException as http_exc:
        # If service raises 404, it will be re-raised here
        raise http_exc
    except Exception as e:
        print(f"API ERROR: remove_cart_item: User {current_user.id}, Prod {prod_id}, Error: {e}")
        # traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while removing the item.",
        )

@router.delete(
    "/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear entire cart",
    description="Removes ALL items from the user's cart.",
    responses={
        204: {"description": "Cart successfully cleared"},
    }
)
def clear_user_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """ Empties the entire shopping cart for the authenticated user. """
    try:
        deleted_count = cart_service.clear_cart(db=db, user_id=current_user.id)
        print(f"API INFO: Cart cleared for user {current_user.id}. Items removed: {deleted_count}")
        return None
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"API ERROR: clear_user_cart: User {current_user.id}, Error: {e}")
        # traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while clearing the cart.",
        )