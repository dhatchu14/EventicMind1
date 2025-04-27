# domain/cart/service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from . import schemas, models
from .repository import CartRepository
# --- Adjust these imports based on your project structure ---
from domain.product.repository import ProductRepository # To check product exists
from domain.inventory.repository import InventoryRepository # To check stock
# You might need the actual models if repositories return them
from domain.product.models import Product as ProductModel # Example alias
from domain.inventory.models import Inventory as InventoryModel # Example alias
# ---

class CartService:
    # Inject dependencies
    def __init__(
        self,
        cart_repository: CartRepository = CartRepository(),
        product_repository: ProductRepository = ProductRepository(),
        inventory_repository: InventoryRepository = InventoryRepository()
    ):
        self.cart_repository = cart_repository
        self.product_repository = product_repository
        self.inventory_repository = inventory_repository

    def _get_available_stock(self, db: Session, product_id: int) -> int:
        """
        Helper to get current available stock for a product.
        Raises 404 if product doesn't exist. Returns 0 if no inventory record.
        """
        # Check if product exists
        product: Optional[ProductModel] = self.product_repository.get_product(db, product_id) # Adapt method name
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found."
            )

        # Get inventory stock
        inventory: Optional[InventoryModel] = self.inventory_repository.get_inventory_by_prod_id(db, product_id) # Adapt method name
        return inventory.stock if inventory and inventory.stock is not None else 0

    def get_cart(self, db: Session, user_id: int) -> schemas.CartOut:
        """Gets the user's cart items and formats them for output."""
        items_db: List[models.CartItem] = self.cart_repository.get_user_cart_items(db, user_id)

        # Map DB models to Pydantic CartItemOut schema
        items_out = [schemas.CartItemOut.model_validate(item) for item in items_db] # Pydantic V2
        # items_out = [schemas.CartItemOut.from_orm(item) for item in items_db] # Pydantic V1

        # Here you could add logic to calculate totals if needed for CartOut
        # total_items = sum(item.quantity for item in items_out)
        # total_cost = ... (fetch product prices and calculate)

        return schemas.CartOut(
            items=items_out,
            # total_items=total_items, # Example
            # total_cost=total_cost    # Example
        )

    def add_or_update_item(
        self, db: Session, user_id: int, item_data: schemas.CartItemCreate
    ) -> schemas.CartItemOut:
        """
        Adds an item or updates quantity, validating against stock.
        Returns the state of the cart item after the operation.
        """
        prod_id = item_data.prod_id
        requested_quantity = item_data.quantity # Quantity being added in *this* request

        # 1. Check available stock (includes product existence check via helper)
        available_stock = self._get_available_stock(db, prod_id)

        # 2. Get existing cart item, if any
        existing_cart_item: Optional[models.CartItem] = self.cart_repository.get_cart_item(db, user_id, prod_id)

        if existing_cart_item:
            # --- UPDATE ---
            new_total_quantity = existing_cart_item.quantity + requested_quantity

            if new_total_quantity > available_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(f"Cannot add {requested_quantity} item(s). Requested total ({new_total_quantity}) "
                            f"exceeds available stock ({available_stock}). "
                            f"You currently have {existing_cart_item.quantity} in your cart.")
                )

            # Update in repository
            updated_item_db = self.cart_repository.update_item_quantity(
                db, existing_cart_item, new_total_quantity
            )
            if updated_item_db is None: # Handle case where update sets quantity to 0 and removes item
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Update resulted in zero quantity; item removed.") # Or handle differently

        else:
            # --- ADD NEW ---
            if requested_quantity > available_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(f"Cannot add {requested_quantity} item(s). "
                            f"Only {available_stock} available in stock.")
                )

            # Add via repository
            updated_item_db = self.cart_repository.add_item(
                db, user_id, prod_id, requested_quantity
            )

        # Map the final state (added or updated) to the output schema
        return schemas.CartItemOut.model_validate(updated_item_db) # Pydantic V2
        # return schemas.CartItemOut.from_orm(updated_item_db) # Pydantic V1


    def remove_item(self, db: Session, user_id: int, prod_id: int) -> None:
        """Removes an item completely from the user's cart."""
        cart_item = self.cart_repository.get_cart_item(db, user_id, prod_id)
        if not cart_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product ID {prod_id} not found in cart."
            )
        # Repository handles the actual deletion and commit/rollback
        self.cart_repository.remove_item(db, cart_item)
        # No return value needed for endpoint returning 204

    def clear_cart(self, db: Session, user_id: int) -> int:
        """Clears all items from the user's cart. Returns count deleted."""
        # Repository handles deletion and commit/rollback
        deleted_count = self.cart_repository.clear_user_cart(db, user_id)
        return deleted_count

    # --- Method potentially used by an Order Service during checkout ---
    def get_cart_items_for_checkout(self, db: Session, user_id: int) -> List[models.CartItem]:
        """Gets raw cart item models for order processing (may need locking)."""
        # IMPORTANT: If high concurrency is expected, consider locking these rows
        # within the order transaction using `with_for_update()` in the repository query.
        # e.g., db.query(models.CartItem)...filter(...).with_for_update().all()
        return self.cart_repository.get_user_cart_items(db, user_id)