# app/product/models.py
from sqlalchemy import Column, Integer, String, Float, Text, Index # Import Text
from sqlalchemy.orm import relationship # <-- Import relationship
from config.db import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    image_url = Column(String, nullable=True)
    category = Column(String, index=True, nullable=True)
    specifications = Column(Text, nullable=True)
    features = Column(Text, nullable=True)

    # --- ADD THIS RELATIONSHIP ---
    # `uselist=False` because one product has one inventory record.
    # `cascade="all, delete-orphan"` means if a Product is deleted, its Inventory record is also deleted.
    inventory_item = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")

Index("ix_product_name", Product.name)
Index("ix_product_category", Product.category)