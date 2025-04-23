# domain/cart/models.py
from sqlalchemy import (
    Column, Integer, ForeignKey, UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship # Keep relationship import
from config.db import Base
# --- REMOVE User import ---
# from domain.authentication.models import User # No longer needed here
# Import Product if needed, or use string reference for it too
from domain.product.models import Product

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    # Keep ForeignKeys referencing the table.column names
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prod_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)

    # --- Use STRINGS for related models ---
    user = relationship(
        "User", # <-- Use the class name as a string
        back_populates="cart_items"
    )
    # You can use a string for product too if needed
    # product = relationship("Product")
    # Or keep the import if Product doesn't import CartItem back
    product = relationship(Product) # Keep imported Product if no circularity there
    # --------------------------------------

    __table_args__ = (
        UniqueConstraint('user_id', 'prod_id', name='uq_user_product_cart'),
        CheckConstraint('quantity > 0', name='check_cart_item_quantity_positive')
    )