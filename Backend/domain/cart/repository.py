# domain/cart/repository.py
import starlette.status as stat
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List
from . import models
# Ensure Product model can be imported if needed for type hinting, but relationship uses string
# from domain.product.models import Product

class CartRepository:

    def get_cart_item(self, db: Session, user_id: int, prod_id: int) -> Optional[models.CartItem]:
        """Gets a specific cart item, eagerly loading the product."""
        try:
            return db.query(models.CartItem)\
                     .options(joinedload(models.CartItem.product))\
                     .filter(models.CartItem.user_id == user_id, models.CartItem.prod_id == prod_id)\
                     .first()
        except SQLAlchemyError as e:
            print(f"DATABASE ERROR - get_cart_item for user {user_id}, prod {prod_id}: {e}")
            db.rollback()
            raise # Re-raise to allow service layer to handle

    def get_user_cart_items(self, db: Session, user_id: int) -> List[models.CartItem]:
        """Gets all cart items for a user, eagerly loading product details."""
        print(f"REPOSITORY: Fetching cart items for user {user_id} with joinedload(product)")
        try:
            items = db.query(models.CartItem)\
                      .options(joinedload(models.CartItem.product))\
                      .filter(models.CartItem.user_id == user_id)\
                      .order_by(models.CartItem.id)\
                      .all() # <<< CORRECTED INDENTATION HERE
            print(f"REPOSITORY: Found {len(items)} items for user {user_id}")
            # Debug: Check if product is actually loaded on the first item (if any)
            # if items:
            #    print(f"REPOSITORY DEBUG: First item product loaded: {hasattr(items[0], 'product') and items[0].product is not None}")
            return items
        except SQLAlchemyError as e:
            print(f"DATABASE ERROR - get_user_cart_items for user {user_id}: {e}")
            db.rollback()
            raise # Correctly indented
        except Exception as e:
            print(f"UNEXPECTED ERROR in get_user_cart_items for user {user_id}: {e}")
            raise # <<< CORRECTED INDENTATION HERE (ensure it's under the 'except Exception')

    def add_item(self, db: Session, user_id: int, prod_id: int, quantity: int) -> models.CartItem:
        """Adds a new item. Assumes validation (stock, product exists) done before call."""
        db_item = models.CartItem(
            user_id=user_id,
            prod_id=prod_id,
            quantity=quantity
        )
        try:
            db.add(db_item)
            db.commit()
            # Refresh the item AND its product relationship needed for CartItemOut schema
            db.refresh(db_item, attribute_names=['product'])
            print(f"REPOSITORY: Added item prod_id={prod_id} for user {user_id}, refreshed product.")
            return db_item
        except SQLAlchemyError as e:
            db.rollback()
            print(f"DATABASE ERROR - add_item: {e}")
            # Consider raising a more specific custom exception if needed
            raise HTTPException(status_code=stat.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error adding item.") from e

    def update_item_quantity(self, db: Session, cart_item: models.CartItem, new_quantity: int) -> Optional[models.CartItem]:
        """Updates quantity. Returns updated item or None if quantity <= 0 caused removal."""
        if new_quantity <= 0:
            prod_id = cart_item.prod_id # Capture details before potential removal
            user_id = cart_item.user_id
            print(f"REPOSITORY: Quantity <= 0 ({new_quantity}) for prod_id={prod_id}, user={user_id}. Removing item.")
            self.remove_item(db, cart_item) # Use the remove method
            return None # Indicate removal

        cart_item.quantity = new_quantity
        try:
            # Add instance to session to track changes (SQLAlchemy usually does this automatically for loaded objects)
            # db.add(cart_item)
            db.commit()
            # Refresh the item AND its product relationship
            db.refresh(cart_item, attribute_names=['product'])
            print(f"REPOSITORY: Updated item prod_id={cart_item.prod_id} user={cart_item.user_id} to quantity={new_quantity}, refreshed product.")
            return cart_item
        except SQLAlchemyError as e:
            db.rollback()
            print(f"DATABASE ERROR - update_item_quantity: {e}")
            raise HTTPException(status_code=stat.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error updating quantity.") from e

    def remove_item(self, db: Session, cart_item: models.CartItem) -> None:
        """Removes a specific cart item instance."""
        prod_id = cart_item.prod_id
        user_id = cart_item.user_id
        try:
            db.delete(cart_item)
            db.commit()
            print(f"REPOSITORY: Removed item prod_id={prod_id} for user {user_id}")
        except SQLAlchemyError as e:
            db.rollback()
            print(f"DATABASE ERROR - remove_item: {e}")
            raise HTTPException(status_code=stat.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error removing item.") from e

    def clear_user_cart(self, db: Session, user_id: int) -> int:
        """Removes all items for a user. Returns the count deleted."""
        try:
            # Use synchronize_session=False for potentially better performance on bulk delete
            num_deleted = db.query(models.CartItem)\
                            .filter(models.CartItem.user_id == user_id)\
                            .delete(synchronize_session='fetch') # 'fetch' or False common strategies
            db.commit()
            print(f"REPOSITORY: Cleared {num_deleted} items for user {user_id}")
            return num_deleted
        except SQLAlchemyError as e:
            db.rollback()
            print(f"DATABASE ERROR - clear_user_cart for user {user_id}: {e}")
            raise HTTPException(status_code=stat.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error clearing cart.") from e