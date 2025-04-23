# app/domain/inventory/models.py
from sqlalchemy import Column, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from config.db import Base
# Assuming your product model is in app.product.models
# Adjust the import path if necessary
from domain.product.models import Product

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    # Use the actual primary key column name from the Product model
    prod_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    stock = Column(Integer, nullable=False, default=0) # Default stock to 0

    # Define the relationship (optional but good practice)
    # The back_populates should match the relationship name in Product model if you define one there
    product = relationship("Product", back_populates="inventory_item")

# Optional: Add an index for prod_id if not already done by index=True
# Index("ix_inventory_prod_id", Inventory.prod_id, unique=True)

# --- IMPORTANT: Add the relationship to the Product model ---
# You need to modify your existing app/product/models.py
# Add the following line inside the Product class:
# inventory_item = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")
# Make sure to import relationship from sqlalchemy.orm in product/models.py as well