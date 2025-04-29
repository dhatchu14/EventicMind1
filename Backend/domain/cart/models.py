# domain/cart/models.py
from sqlalchemy import (
    Column, Integer, ForeignKey, UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship
from config.db import Base
# from domain.product.models import Product # Can remove if using string relationship consistently

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    # Keep ForeignKeys referencing the table.column names
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prod_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)

    # --- Use STRINGS for related models to prevent circular imports ---
    user = relationship(
        "User", # <-- Use the class name as a string
        back_populates="cart_items" # Assumes User model has 'cart_items = relationship("CartItem", back_populates="user")'
    )
    # Use string for Product relationship
    product = relationship(
        "Product" # <-- Use the class name as a string
        # Add back_populates if Product links back, e.g., back_populates="cart_items"
        # If Product doesn't link back, this is sufficient. Eager loading still works.
    )
    # -----------------------------------------------------------------

    __table_args__ = (
        UniqueConstraint('user_id', 'prod_id', name='uq_user_product_cart'),
        # Ensure DB enforces positive quantity (adjust if 0 is allowed for some reason)
        CheckConstraint('quantity > 0', name='check_cart_item_quantity_positive')
    )

# --- Ensure User and Product models are defined elsewhere ---
# Example structure expected in domain/authentication/models.py:
# class User(Base):
#     ...
#     cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
#     ...

# Example structure expected in domain/product/models.py:
# class Product(Base):
#     ...
#     # If Product needs access to cart items (less common):
#     # cart_items = relationship("CartItem", back_populates="product")
#     ...