# domain/order/repository.py
from sqlalchemy.orm import Session, joinedload, contains_eager
from typing import List, Optional, Type

from . import models, schemas

# --- IMPORTANT: Import necessary models from other domains ---
# Adjust these imports based on your actual project structure
try:
    # Assuming User model is needed for filtering/association
    from domain.authentication.models import User as UserModel
except ImportError:
    # Define a placeholder if User model isn't directly available or needed for typing
    class UserModel: pass

try:
    # Assuming CartItem model is needed by the service layer
    from domain.cart.models import CartItem as CartModel
    # Assuming Product model is needed by the service layer
    from domain.product.models import Product as ProductModel
except ImportError:
    # Provide dummy classes if needed for type hinting or basic functionality
    print("Warning: Cart or Product models not found. Order service might need adjustments.")
    class CartModel: product_id: int; quantity: int
    class ProductModel: id: int; price: float


class DeliveryRepository:
    """Handles database operations for Delivery models."""

    def save_delivery(self, db: Session, *, delivery_in: schemas.DeliveryCreate, user_id: int) -> models.Delivery:
        """
        Creates and saves a new Delivery record associated with a user.
        """
        db_delivery = models.Delivery(
            **delivery_in.dict(),  # Unpack validated schema data
            user_id=user_id        # Add the owner's ID
        )
        db.add(db_delivery)
        db.commit()
        db.refresh(db_delivery) # Load DB-generated fields like id, created_at
        return db_delivery

    def get_delivery_by_id_and_user(self, db: Session, *, delivery_id: int, user_id: int) -> Optional[models.Delivery]:
        """
        Retrieves a specific Delivery record only if it belongs to the specified user.
        Returns None if not found or not owned by the user.
        """
        return db.query(models.Delivery).filter(
            models.Delivery.id == delivery_id,
            models.Delivery.user_id == user_id
        ).first()


class OrderRepository:
    """Handles database operations for Order and OrderItem models."""

    def create_order(self, db: Session, *, order_data: dict) -> models.Order:
        """
        Creates an Order record in the database.
        Does NOT commit; commit should happen after adding items in the service layer.
        """
        # order_data should contain user_id, delivery_id, total_amount, etc.
        # Statuses can be passed or rely on model defaults
        db_order = models.Order(**order_data)
        db.add(db_order)
        db.flush()  # Assigns an ID to db_order without committing the transaction
        db.refresh(db_order) # Load the generated ID and defaults
        return db_order

    def add_order_items(self, db: Session, *, order_items_data: List[dict]) -> List[models.OrderItem]:
        """
        Creates multiple OrderItem records linked to an order.
        Does NOT commit; commit should happen after creating the order and items.
        Expects 'order_id' to be present in each item dict in order_items_data.
        """
        db_items = [models.OrderItem(**item_data) for item_data in order_items_data]
        db.add_all(db_items)
        db.flush() # Process the items within the transaction
        return db_items # Return the ORM objects if needed

    def get_order_by_id_and_user(self, db: Session, *, order_id: int, user_id: int) -> Optional[models.Order]:
        """
        Retrieves a specific order with its details (delivery info, items)
        only if it belongs to the specified user.
        Uses joined loading for efficiency.
        """
        # Using joinedload ensures related objects are fetched in the same query
        query = db.query(models.Order).options(
            joinedload(models.Order.delivery_info), # Eager load delivery details
            joinedload(models.Order.items)         # Eager load order items
            # If you need product details within items, chain the joinedload:
            # joinedload(models.Order.items).joinedload(models.OrderItem.product)
        ).filter(
            models.Order.id == order_id,
            models.Order.user_id == user_id
        )
        return query.first()

    def get_user_orders(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Order]:
        """
        Retrieves a list of orders belonging to a specific user, ordered by creation date.
        Includes related delivery_info and items due to lazy='joined' on the model
        or explicit joinedload options if needed.
        """
        return db.query(models.Order)\
            .filter(models.Order.user_id == user_id)\
            .order_by(models.Order.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()

# Instantiate repositories for potential direct use or dependency injection
delivery_repository = DeliveryRepository()
order_repository = OrderRepository()