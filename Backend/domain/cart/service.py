# domain/cart/service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from . import schemas, models, repository as cart_repo
from domain.inventory.repository import InventoryRepository # Import Inventory Repo
from domain.inventory.service import InventoryService # Or service if preferred
from domain.product.repository import ProductRepository # Needed to check product existence

class CartService:
    def __init__(
        self,
        cart_repository: cart_repo.CartRepository = cart_repo.CartRepository(),
        inventory_repository: InventoryRepository = InventoryRepository(),
        product_repository: ProductRepository = ProductRepository()
        ):
        self.cart_repository = cart_repository
        self.inventory_repository = inventory_repository
        self.product_repository = product_repository
        # self.inventory_service = InventoryService() # Alternative if using service methods

    def _get_available_stock(self, db: Session, product_id: int) -> int:
        """Helper to get current stock, returning 0 if no inventory record."""
         # First check if product exists at all
        product = self.product_repository.get_product(db, product_id)
        if not product:
             raise HTTPException(
                 status_code=status.HTTP_404_NOT_FOUND,
                 detail=f"Product with id {product_id} not found."
             )

        inventory = self.inventory_repository.get_inventory_by_prod_id(db, product_id)
        return inventory.stock if inventory else 0

    def get_cart(self, db: Session, user_id: int) -> schemas.CartOut:
        """Gets the user's cart."""
        items = self.cart_repository.get_user_cart_items(db, user_id)
        # Here you could enhance items with product details if needed
        # enhanced_items = []
        # for item in items:
        #    product_details = self.product_repository.get_product(db, item.prod_id)
        #    # Create CartItemOut including product details
        #    enhanced_items.append(...)
        return schemas.CartOut(items=items) # Return directly mapped items for now

    def add_or_update_item(
        self, db: Session, user_id: int, item_data: schemas.CartItemCreate
    ) -> models.CartItem:
        """Adds item or updates quantity, validating against stock."""
        prod_id = item_data.prod_id
        requested_quantity = item_data.quantity # This is the amount to ADD or SET

        # 1. Check available stock
        available_stock = self._get_available_stock(db, prod_id)

        # 2. Check if item already exists in cart
        existing_cart_item = self.cart_repository.get_cart_item(db, user_id, prod_id)

        if existing_cart_item:
            # --- UPDATE existing item ---
            # Calculate the NEW total quantity desired in the cart
            new_total_quantity = existing_cart_item.quantity + requested_quantity

            # Validate against stock
            if new_total_quantity > available_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot add {requested_quantity}. Only {available_stock - existing_cart_item.quantity} more available. Current in cart: {existing_cart_item.quantity}."
                )

            # Update the quantity in the repository
            updated_item = self.cart_repository.update_item_quantity(
                db, existing_cart_item, new_total_quantity
            )
            return updated_item
        else:
            # --- ADD new item ---
            # Validate requested quantity against available stock
            if requested_quantity > available_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot add {requested_quantity}. Only {available_stock} available in stock."
                )

            # Add the new item via the repository
            new_item = self.cart_repository.add_item(
                db, user_id, prod_id, requested_quantity
            )
            return new_item

    def remove_item(self, db: Session, user_id: int, prod_id: int) -> models.CartItem:
        """Removes an item completely from the user's cart."""
        cart_item = self.cart_repository.get_cart_item(db, user_id, prod_id)
        if not cart_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found in cart."
            )
        return self.cart_repository.remove_item(db, cart_item)

    def clear_cart(self, db: Session, user_id: int) -> int:
        """Clears all items from the user's cart."""
        return self.cart_repository.clear_user_cart(db, user_id)

    # --- Method for Order Process ---
    def get_cart_for_order(self, db: Session, user_id: int) -> List[models.CartItem]:
        """Gets cart items, intended for use within an order transaction."""
        # Could add locking here if needed: db.query(models.CartItem)...with_for_update().all()
        return self.cart_repository.get_user_cart_items(db, user_id)

    def decrease_inventory_after_order(self, db: Session, cart_items: List[models.CartItem]):
        """Decrements inventory based on cart items. Assumes checks are done."""
        # IMPORTANT: This should happen within the same transaction as order creation
        for item in cart_items:
            inventory = self.inventory_repository.get_inventory_by_prod_id(db, item.prod_id)
            if not inventory or inventory.stock < item.quantity:
                # This check should ideally happen BEFORE this function is called,
                # within the transaction, potentially with row locking.
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT, # Conflict state
                    detail=f"Insufficient stock for product ID {item.prod_id} during order finalization."
                )
            inventory.stock -= item.quantity
            db.add(inventory) # Add to session for commit
        # The actual db.commit() should happen after this function returns,
        # as part of the larger order transaction commit.


# Instantiate the service
cart_service = CartService()