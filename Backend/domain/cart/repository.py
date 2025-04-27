# domain/cart/repository.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List
from . import models

class CartRepository:

    def get_cart_item(self, db: Session, user_id: int, prod_id: int) -> Optional[models.CartItem]:
        """Gets a specific cart item for a user and product."""
        return db.query(models.CartItem).filter(
            models.CartItem.user_id == user_id,
            models.CartItem.prod_id == prod_id
        ).first()

    def get_user_cart_items(self, db: Session, user_id: int) -> List[models.CartItem]:
        """Gets all cart items for a specific user."""
        # Consider adding .options(joinedload(models.CartItem.product))
        # if you frequently need product details to avoid N+1 queries.
        return db.query(models.CartItem).filter(models.CartItem.user_id == user_id).all()

    def add_item(self, db: Session, user_id: int, prod_id: int, quantity: int) -> models.CartItem:
        """Adds a new item to the user's cart. Assumes validation done before call."""
        db_item = models.CartItem(
            user_id=user_id,
            prod_id=prod_id,
            quantity=quantity
        )
        try:
            db.add(db_item)
            db.commit()
            db.refresh(db_item)
            return db_item
        except SQLAlchemyError as e:
            db.rollback()
            print(f"DATABASE ERROR - add_item: {e}") # Basic logging
            raise e # Re-raise for service layer to handle

    def update_item_quantity(self, db: Session, cart_item: models.CartItem, new_quantity: int) -> models.CartItem:
        """Updates the quantity of an existing cart item. Assumes validation done."""
        if new_quantity <= 0:
             # This check is a safeguard; primary validation should be in service
             # If logic allows quantity 0, it should likely trigger removal instead.
             db.delete(cart_item) # Example: remove if quantity becomes 0
             db.commit()
             return None # Indicate item was removed
             # Or raise ValueError("Quantity must be positive.") if 0 is invalid

        cart_item.quantity = new_quantity
        try:
            db.add(cart_item) # Add instance to session to track changes
            db.commit()
            db.refresh(cart_item)
            return cart_item
        except SQLAlchemyError as e:
            db.rollback()
            print(f"DATABASE ERROR - update_item_quantity: {e}")
            raise e

    def remove_item(self, db: Session, cart_item: models.CartItem) -> None:
        """Removes a specific cart item instance from the database."""
        try:
            db.delete(cart_item)
            db.commit()
        except SQLAlchemyError as e:
            db.rollback()
            print(f"DATABASE ERROR - remove_item: {e}")
            raise e

    def clear_user_cart(self, db: Session, user_id: int) -> int:
        """Removes all items from a user's cart. Returns the number of items deleted."""
        try:
            num_deleted = db.query(models.CartItem)\
                            .filter(models.CartItem.user_id == user_id)\
                            .delete(synchronize_session=False) # More efficient
            db.commit()
            return num_deleted
        except SQLAlchemyError as e:
            db.rollback()
            print(f"DATABASE ERROR - clear_user_cart for user {user_id}: {e}")
            raise e