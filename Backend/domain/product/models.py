# app/product/models.py
from sqlalchemy import Column, Integer, String, Float, Text, Index # Import Text
from config.db import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True) # Use Text for longer descriptions
    price = Column(Float, nullable=False)
    image_url = Column(String, nullable=True)
    category = Column(String, index=True, nullable=True) # NEW: Added category
    specifications = Column(Text, nullable=True)         # NEW: Added specifications (use Text)
    features = Column(Text, nullable=True)               # NEW: Added features (use Text)

# Optional: Add indexes
Index("ix_product_name", Product.name)
Index("ix_product_category", Product.category) # Index for category