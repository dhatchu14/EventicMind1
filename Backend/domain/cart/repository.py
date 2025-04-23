# domain/cart/repository.py
from sqlalchemy.orm import Session
from typing import Optional, List
from . import models, schemas

class CartRepository:

    def get_cart_item(self, db: Session, user_id: int, prod_id: int) -> Optional[models.CartItem]:
        """Gets a specific cart item for a user and product."""
        return db.query(models.CartItem).filter(
            models.CartItem.user_id == user_id,
            models.CartItem.prod_id == prod_id
        ).first()

    def get_user_cart_items(self, db: Session, user_id: int) -> List[models.CartItem]:
        """Gets all cart items for a specific user."""
        return db.query(models.CartItem).filter(models.CartItem.user_id == user_id).all()

    def add_item(self, db: Session, user_id: int, prod_id: int, quantity: int) -> models.CartItem:
        """Adds a new item to the user's cart."""
        db_item = models.CartItem(
            user_id=user_id,
            prod_id=prod_id,
            quantity=quantity
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    def update_item_quantity(self, db: Session, cart_item: models.CartItem, quantity: int) -> models.CartItem:
        """Updates the quantity of an existing cart item."""
        if quantity <= 0: # Should be caught by schema/service, but extra check
             raise ValueError("Quantity must be positive.")
        cart_item.quantity = quantity
        db.add(cart_item) # Add to session to track changes
        db.commit()
        db.refresh(cart_item)
        return cart_item

    def remove_item(self, db: Session, cart_item: models.CartItem) -> models.CartItem:
        """Removes a specific cart item instance from the database."""
        deleted_item_id = cart_item.id # Store id before deletion if needed
        db.delete(cart_item)
        db.commit()
        # Return the original object (now detached) or just confirmation
        return cart_item # Or return {"message": "Item removed", "id": deleted_item_id}

    def clear_user_cart(self, db: Session, user_id: int) -> int:
        """Removes all items from a user's cart. Returns the number of items deleted."""
        num_deleted = db.query(models.CartItem).filter(models.CartItem.user_id == user_id).delete()
        db.commit()
        return num_deleted