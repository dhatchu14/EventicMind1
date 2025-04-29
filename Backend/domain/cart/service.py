# domain/cart/service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from . import schemas, models
from .repository import CartRepository
# --- Adjust these imports based on your project structure ---
from domain.product.repository import ProductRepository # To check product exists/details
from domain.inventory.repository import InventoryRepository # To check stock
# Import the specific models if needed for type hinting or checks
from domain.product.models import Product as ProductModel
from domain.inventory.models import Inventory as InventoryModel

class CartService:
    def __init__(
        self,
        cart_repository: CartRepository = CartRepository(),
        product_repository: ProductRepository = ProductRepository(),
        inventory_repository: InventoryRepository = InventoryRepository()
    ):
        self.cart_repository = cart_repository
        self.product_repository = product_repository
        self.inventory_repository = inventory_repository

    def _get_product_or_404(self, db: Session, product_id: int) -> ProductModel:
        """ Helper to get product, raising 404 if not found. """
        product = self.product_repository.get_product(db, product_id) # Adapt method name if needed
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found."
            )
        return product

    def _get_available_stock(self, db: Session, product_id: int) -> int:
        """
        Helper to get current available stock for a product.
        Raises 404 if product doesn't exist (via _get_product_or_404).
        Returns 0 if no inventory record.
        """
        self._get_product_or_404(db, product_id) # Ensure product exists first

        inventory = self.inventory_repository.get_inventory_by_prod_id(db, product_id) # Adapt method name if needed
        stock = inventory.stock if inventory and inventory.stock is not None else 0
        # print(f"SERVICE DEBUG: Stock check for prod_id {product_id}: {stock}")
        return stock

    def get_cart(self, db: Session, user_id: int) -> schemas.CartOut:
        """Gets the user's cart items, ensuring product details are loaded for output."""
        print(f"SERVICE: get_cart called for user_id: {user_id}")
        items_db: List[models.CartItem] = self.cart_repository.get_user_cart_items(db, user_id)
        print(f"SERVICE: Found {len(items_db)} raw items in DB for user {user_id}.")

        items_out: List[schemas.CartItemOut] = []
        for item in items_db:
            print(f"SERVICE: Processing CartItem id={item.id}, prod_id={item.prod_id}, quantity={item.quantity}")

            # Verify product relationship was loaded (crucial check)
            if not hasattr(item, 'product') or item.product is None:
                # This indicates a failure in eager loading (repo) or relationship definition (model)
                print(f"SERVICE CRITICAL ERROR: Product relationship not loaded for CartItem id={item.id}, prod_id={item.prod_id}!")
                # Don't try to validate, raise immediately
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Internal Server Error: Failed to load product details for cart item (Product ID {item.prod_id})."
                )

            product_name = getattr(item.product, 'name', 'N/A') # Safe access for logging
            print(f"SERVICE:   Product data appears loaded: id={item.product.id}, name='{product_name}'")

            # Attempt Pydantic Validation (This is where 500 happens if data mismatch)
            try:
                # Ensure schemas.ProductRead fields match the actual item.product attributes
                validated_item = schemas.CartItemOut.model_validate(item) # Pydantic V2
                # validated_item = schemas.CartItemOut.from_orm(item) # Pydantic V1
                items_out.append(validated_item)
                print(f"SERVICE:   Successfully validated CartItem id={item.id} into CartItemOut.")
            except Exception as validation_error:
                # Log detailed error if validation fails
                print(f"SERVICE ERROR: Pydantic validation FAILED for CartItem id={item.id}, prod_id={item.prod_id}")
                print(f"SERVICE ERROR DETAILS: {validation_error}")
                # Log the raw data causing the failure
                print(f"SERVICE ERROR DATA DUMP: CartItem={vars(item)}, Product={vars(item.product)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Server error processing cart item (Product ID {item.prod_id}). Check server logs for validation details."
                ) from validation_error # Preserve original exception trace

        print(f"SERVICE: Finished processing. Returning CartOut with {len(items_out)} validated items for user {user_id}.")
        return schemas.CartOut(items=items_out)


    def add_or_update_item(
        self, db: Session, user_id: int, item_data: schemas.CartItemCreate
    ) -> schemas.CartItemOut:
        """
        Adds item or increases quantity. Validates product existence and stock.
        Returns the state of the cart item after operation.
        """
        prod_id = item_data.prod_id
        requested_quantity_increase = item_data.quantity # Qty to ADD in this request

        # 1. Check stock (includes product existence check via helper)
        available_stock = self._get_available_stock(db, prod_id)

        # 2. Get existing cart item
        existing_cart_item = self.cart_repository.get_cart_item(db, user_id, prod_id)

        updated_item_db: Optional[models.CartItem] = None

        if existing_cart_item:
            # --- UPDATE existing item ---
            print(f"SERVICE: add_or_update - Updating existing item prod_id={prod_id}, user={user_id}.")
            new_total_quantity = existing_cart_item.quantity + requested_quantity_increase

            if new_total_quantity > available_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(f"Cannot add {requested_quantity_increase}. Requested total ({new_total_quantity}) "
                            f"exceeds available stock ({available_stock}). "
                            f"You already have {existing_cart_item.quantity} in cart.")
                )

            updated_item_db = self.cart_repository.update_item_quantity(
                db, existing_cart_item, new_total_quantity
            )
            # update_item_quantity returns None if it removed the item (e.g., new_qty <= 0)
            # This path shouldn't be hit if requested_quantity_increase > 0.
            if updated_item_db is None:
                 print(f"SERVICE ERROR: update_item_quantity unexpectedly returned None for prod_id {prod_id}")
                 raise HTTPException(status_code=500, detail="Internal error updating cart item.")

        else:
            # --- ADD NEW item ---
            print(f"SERVICE: add_or_update - Adding new item prod_id={prod_id}, user={user_id}.")
            if requested_quantity_increase > available_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot add {requested_quantity_increase}. Only {available_stock} available in stock."
                )

            updated_item_db = self.cart_repository.add_item(
                db, user_id, prod_id, requested_quantity_increase
            )

        # This check is redundant if repository raises on error, but good safeguard.
        if updated_item_db is None:
             print(f"SERVICE ERROR: add_or_update - DB operation returned None unexpectedly for prod_id {prod_id}")
             raise HTTPException(status_code=500, detail="Internal Server Error: Failed to get cart item after update.")

        # --- Validate and Return Result ---
        try:
            # The repository refresh should ensure product is loaded.
            validated_item = schemas.CartItemOut.model_validate(updated_item_db) # Pydantic V2
            # validated_item = schemas.CartItemOut.from_orm(updated_item_db) # Pydantic V1
            print(f"SERVICE: add_or_update - Successfully validated item prod_id={prod_id}, user={user_id}.")
            return validated_item
        except Exception as e:
            print(f"SERVICE ERROR: Failed Pydantic validation after add/update for prod_id {prod_id}, user {user_id}: {e}")
            print(f"SERVICE ERROR DATA DUMP: DB Item={vars(updated_item_db)}, Product={vars(getattr(updated_item_db, 'product', None))}")
            raise HTTPException(status_code=500, detail="Failed to format cart item after update. Check server logs.") from e


    def set_item_quantity(
        self, db: Session, user_id: int, prod_id: int, quantity: int
    ) -> schemas.CartItemOut:
        """
        Sets the quantity for a specific item. Validates stock.
        Raises 400 if quantity is <= 0 (use POST/DELETE).
        Raises 404 if item not in cart.
        """
        print(f"SERVICE: set_item_quantity called for user {user_id}, prod_id {prod_id}, quantity {quantity}")

        # --- Input Validation ---
        if quantity <= 0:
             # Business Rule: PUT modifies existing item to a specific state > 0.
             # Use POST to add/increase, DELETE to remove.
            print(f"SERVICE: set_item_quantity - Invalid quantity ({quantity}). Use DELETE to remove.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be positive. Use DELETE endpoint to remove items."
            )
        # --- End Input Validation ---

        # 1. Check Stock (includes product existence)
        available_stock = self._get_available_stock(db, prod_id)
        if quantity > available_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot set quantity to {quantity}. Only {available_stock} available in stock."
            )

        # 2. Check if item exists in cart (essential for PUT)
        existing_cart_item = self.cart_repository.get_cart_item(db, user_id, prod_id)
        if not existing_cart_item:
            print(f"SERVICE: set_item_quantity - Item prod_id={prod_id} not found in cart for user {user_id}. Raising 404.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product ID {prod_id} not found in your cart. Cannot set quantity."
            )

        # 3. Update quantity in repository (will handle quantity > 0)
        updated_item_db = self.cart_repository.update_item_quantity(db, existing_cart_item, quantity)

        # Should not be None if quantity > 0
        if updated_item_db is None:
             print(f"SERVICE ERROR: update_item_quantity returned None unexpectedly for positive quantity {quantity}, prod_id {prod_id}")
             raise HTTPException(status_code=500, detail="Internal error setting item quantity.")

        # 4. Validate and return the updated item
        try:
            validated_item = schemas.CartItemOut.model_validate(updated_item_db) # Pydantic V2
            # validated_item = schemas.CartItemOut.from_orm(updated_item_db) # Pydantic V1
            print(f"SERVICE: Successfully set quantity and validated item prod_id={prod_id} to quantity={quantity}.")
            return validated_item
        except Exception as e:
            print(f"SERVICE ERROR: Failed Pydantic validation after set_quantity for prod_id {prod_id}, user {user_id}: {e}")
            print(f"SERVICE ERROR DATA DUMP: DB Item={vars(updated_item_db)}, Product={vars(getattr(updated_item_db, 'product', None))}")
            raise HTTPException(status_code=500, detail="Failed to format cart item after setting quantity. Check logs.") from e


    def remove_item(self, db: Session, user_id: int, prod_id: int) -> None:
        """Removes an item completely from the user's cart."""
        print(f"SERVICE: remove_item called for user {user_id}, prod_id {prod_id}")
        cart_item = self.cart_repository.get_cart_item(db, user_id, prod_id)
        if not cart_item:
            # Item already gone or never existed, raise 404 for idempotency of DELETE
            print(f"SERVICE: remove_item - Item prod_id={prod_id} not found in cart for user {user_id}. Raising 404.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product ID {prod_id} not found in cart."
            )
        try:
            self.cart_repository.remove_item(db, cart_item)
            print(f"SERVICE: remove_item - Successfully removed item prod_id={prod_id} for user {user_id}.")
        except HTTPException as e:
            # Re-raise HTTP exceptions from the repository
            raise e
        except Exception as e:
            # Catch unexpected errors during removal
            print(f"SERVICE ERROR: Unexpected error during remove_item for prod_id {prod_id}, user {user_id}: {e}")
            raise HTTPException(status_code=500, detail="Internal error removing item from cart.")

    def clear_cart(self, db: Session, user_id: int) -> int:
        """Clears all items from the user's cart. Returns count deleted."""
        print(f"SERVICE: clear_cart called for user {user_id}")
        try:
            deleted_count = self.cart_repository.clear_user_cart(db, user_id)
            print(f"SERVICE: clear_cart - Removed {deleted_count} items for user {user_id}.")
            return deleted_count
        except HTTPException as e:
             raise e
        except Exception as e:
            print(f"SERVICE ERROR: Unexpected error during clear_cart for user {user_id}: {e}")
            raise HTTPException(status_code=500, detail="Internal error clearing cart.")


    # Optional method for other services (like order creation)
    def get_cart_items_for_checkout(self, db: Session, user_id: int) -> List[models.CartItem]:
        """Gets raw cart item models for processing (e.g., checkout)."""
        # Consider adding row-level locking (`with_for_update()`) in the repository
        # if these items need to be locked during checkout transaction.
        print(f"SERVICE: get_cart_items_for_checkout called for user {user_id}")
        return self.cart_repository.get_user_cart_items(db, user_id) # Uses eager loading