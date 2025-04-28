# domain/cart/endpoints.py
from fastapi import APIRouter, Depends, HTTPException, status, Body, Path
from sqlalchemy.orm import Session
from typing import List

# Local imports (ensure these paths are correct relative to this file)
from . import schemas # This now includes CartItemUpdate
from .service import CartService

# Core dependencies
from config.db import get_db

# Authentication dependencies (adjust path if needed)
from domain.authentication.models import User # For type hinting
# Assuming jwt.py is in security/ and contains get_current_user
from security.jwt import get_current_user

# --- Define the Router WITHOUT the prefix ---
router = APIRouter(
    # prefix="/cart", # REMOVED: Prefix will be added in main.py
    tags=["Cart"],
    responses={
        401: {"description": "Unauthorized - Invalid or missing token"},
        404: {"description": "Not Found - Resource not found"},
        400: {"description": "Bad Request - Invalid input or operation"},
    },
    dependencies=[Depends(get_current_user)]
)
# ---------------------------------------------

# --- Dependency provider for the CartService ---
def get_cart_service() -> CartService:
    """Dependency function to provide a CartService instance."""
    return CartService()
# ---

@router.get(
    "/", # Path relative to prefix -> final path is /cart/
    response_model=schemas.CartOut,
    summary="Get current user's cart",
    description="Retrieves all items, quantities, and calculated totals for the logged-in user's shopping cart.",
)
def get_user_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """ Fetches the complete cart content for the authenticated user. """
    try:
        return cart_service.get_cart(db=db, user_id=current_user.id)
    except Exception as e:
        print(f"ERROR:get_user_cart: User {current_user.id}, Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching the cart."
        )

@router.post(
    "/", # Path relative to prefix -> final path is /cart/
    response_model=schemas.CartItemOut,
    status_code=status.HTTP_200_OK,
    summary="Add item or update quantity in cart",
    description="Adds a specified quantity of a product to the cart. If the product exists, its quantity is updated (added to).",
)
def add_or_update_cart_item(
    item_data: schemas.CartItemCreate = Body(..., example={"prod_id": 1, "quantity": 1}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """ Handles adding items to the cart or updating their quantity. """
    try:
        cart_item = cart_service.add_or_update_item(
            db=db, user_id=current_user.id, item_data=item_data
        )
        return cart_item
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"ERROR:add_or_update_cart_item: User {current_user.id}, Product {item_data.prod_id}, Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating the cart."
        )

# --- Endpoint for PUT (Set specific quantity) ---
# This endpoint now uses the CartItemUpdate schema you added
@router.put(
    "/{prod_id}", # Path relative to prefix -> final path is /cart/{prod_id}
    response_model=schemas.CartItemOut,
    summary="Set specific quantity for an item in cart",
    description="Updates the quantity of an existing item in the cart to a specific value. Use 0 to remove.",
    responses={
        404: {"description": "Item not found in cart or Product not found"},
        # Add 400 if stock validation occurs here
    }
)
def set_cart_item_quantity(
    prod_id: int = Path(..., description="ID of the product in the cart", gt=0),
    # *** Use the CartItemUpdate schema defined in schemas.py ***
    item_update: schemas.CartItemUpdate = Body(..., example={"quantity": 3}),
    # ************************************************************
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """
    Sets the quantity for a specific item in the user's cart.
    - If quantity is set to 0, the item is typically removed (handled by service).
    - Validates stock if applicable.
    """
    try:
        # Validation for quantity >= 0 should be handled by the Pydantic schema now
        updated_item = cart_service.set_item_quantity(
            db=db, user_id=current_user.id, prod_id=prod_id, quantity=item_update.quantity
        )
        return updated_item
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"ERROR:set_cart_item_quantity: User {current_user.id}, Product {prod_id}, Qty {item_update.quantity}, Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while setting item quantity."
        )
# --- End PUT endpoint ---


@router.delete(
    "/{prod_id}", # Path relative to prefix -> final path is /cart/{prod_id}
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove specific item from cart",
    description="Removes a specific product entirely from the logged-in user's cart, regardless of quantity.",
    responses={
        404: {"description": "Item with the specified product ID not found in the user's cart"},
        204: {"description": "Item successfully removed from cart (no content returned)"},
    }
)
def remove_cart_item(
    prod_id: int = Path(..., description="ID of the product to remove from the cart", gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """ Deletes one product entry from the user's cart based on the product ID. """
    try:
        cart_service.remove_item(db=db, user_id=current_user.id, prod_id=prod_id)
        return None
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"ERROR:remove_cart_item: User {current_user.id}, Product {prod_id}, Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while removing the item from the cart."
        )


@router.delete(
    "/", # Path relative to prefix -> final path is /cart/
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear user's entire cart",
    description="Removes ALL items from the logged-in user's shopping cart.",
    responses={
        204: {"description": "Cart successfully cleared (no content returned)"},
    }
)
def clear_user_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cart_service: CartService = Depends(get_cart_service)
):
    """ Empties the entire shopping cart for the currently authenticated user. """
    try:
        deleted_count = cart_service.clear_cart(db=db, user_id=current_user.id)
        print(f"INFO: Cart cleared for user {current_user.id}. Items removed: {deleted_count}")
        return None
    except Exception as e:
        print(f"ERROR:clear_user_cart: User {current_user.id}, Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while clearing the cart."
        )