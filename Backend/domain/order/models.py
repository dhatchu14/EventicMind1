# domain/order/models.py
import datetime
import enum as py_enum # Use alias to avoid confusion with SQLAlchemy Enum
from sqlalchemy import (
    Column, Integer, String, ForeignKey, DateTime, Enum as SQLAlchemyEnum,
    Numeric
)
from sqlalchemy.orm import relationship, declarative_base # Use declarative_base directly if Base isn't shared
from sqlalchemy.sql import func
from config.db import Base
# If you have a shared Base in config.database, use that:
# from config.database import Base
# Otherwise, define it here for this module:

# --- Enums for DB Mapping (Values stored in DB) ---
# Make sure these values match your schemas.py Enums
class OrderStatusEnum(py_enum.Enum):
    PLACED = "Placed"
    PROCESSING = "Processing"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"

class PaymentStatusEnum(py_enum.Enum):
    PENDING = "Pending"
    SUCCESS = "Success"
    FAILED = "Failed"
    REFUNDED = "Refunded"

# --- Models ---

# Assume User and Product models exist elsewhere and 'users', 'products' are table names
# Example placeholder if not directly importable
# class User(Base): __tablename__ = 'users'; id = Column(Integer, primary_key=True)
# class Product(Base): __tablename__ = 'products'; id = Column(Integer, primary_key=True); price = Column(Numeric)


class Delivery(Base):
    """Represents delivery address information linked to a user."""
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    # Foreign key to the user who owns this delivery address
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Fields mapped from the frontend form
    name = Column(String(100), nullable=False) # Combined First + Last Name
    address_line1 = Column(String(255), nullable=False) # Mapped from 'street'
    address_line2 = Column(String(255), nullable=True)  # Optional secondary address info
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=False)    # Mapped from 'zipCode'
    country = Column(String(100), nullable=False)   # Mapped from 'country'
    phone_number = Column(String(30), nullable=False)   # Mapped from 'phone'

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Define relationship back to User (optional, requires 'deliveries' relationship on User model)
    # owner = relationship("User", back_populates="deliveries")

    # Relationship to Order (using backref for simplicity here)
    # A delivery instance is typically linked to one specific order in this flow
    order = relationship("Order", back_populates="delivery_info", uselist=False)


class Order(Base):
    """Represents a customer order."""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    # Foreign key to the user who placed the order
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True) # Keep order even if user deleted? Or CASCADE?
    # Foreign key to the delivery information used for this order
    # Made nullable=False previously, ensure delivery MUST exist
    delivery_id = Column(Integer, ForeignKey("deliveries.id", ondelete="RESTRICT"), nullable=False, unique=True) # Prevent deleting Delivery if Order exists

    # Status fields using Enums
    order_status = Column(SQLAlchemyEnum(OrderStatusEnum, name="order_status_enum"), nullable=False, default=OrderStatusEnum.PLACED)
    payment_status = Column(SQLAlchemyEnum(PaymentStatusEnum, name="payment_status_enum"), nullable=False, default=PaymentStatusEnum.SUCCESS) # As requested

    total_amount = Column(Numeric(10, 2), nullable=False) # Example: Up to 99,999,999.99
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to the Delivery info used
    # lazy='joined' automatically loads delivery info when querying Order
    delivery_info = relationship("Delivery", back_populates="order", lazy="joined")

    # Relationship to the items included in the order
    # cascade="all, delete-orphan" ensures OrderItems are deleted if the Order is deleted
    # lazy='joined' automatically loads items when querying Order
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="joined")

    # Define relationship back to User (optional, requires 'orders' relationship on User model)
    # owner = relationship("User", back_populates="orders")


class OrderItem(Base):
    """Represents a specific product item within an order."""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    # Foreign key to the Order this item belongs to
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    # Foreign key to the Product being ordered
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False) # Prevent deleting Product if used in orders?

    quantity = Column(Integer, nullable=False)
    # Store the price at the time of order creation to avoid issues if product price changes later
    price_per_unit = Column(Numeric(10, 2), nullable=False)

    # Relationship back to the parent Order
    order = relationship("Order", back_populates="items")

    # Relationship back to the Product (optional, useful for retrieving product details with the item)
    # product = relationship("Product", lazy="joined") # Assuming Product model exists


# Reminder: After defining/modifying models, create and apply database migrations.
# Example using Alembic:
# 1. alembic revision --autogenerate -m "Create order, delivery, order_item tables"
# 2. Check the generated script in alembic/versions/
# 3. alembic upgrade head