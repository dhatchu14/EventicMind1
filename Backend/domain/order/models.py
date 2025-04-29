# File: domain/order/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey # Added ForeignKey
from sqlalchemy.orm import relationship # Optional: For relating back to User
from datetime import datetime
from config.db import Base # Assuming Base is correctly defined here

class DeliveryInfo(Base):
    __tablename__ = "delivery_info"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True) # Added index to email potentially
    phone = Column(String, nullable=False)
    street = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip_code = Column(String, nullable=False)
    country = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Optional: Relationship to Order (One-to-Many)
    # orders = relationship("Order", back_populates="delivery_details")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    # --- Link to the User ---
    # IMPORTANT: Adjust 'users.id' if your user table/pk column is named differently
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    # ------------------------
    delivery_info_id = Column(Integer, ForeignKey('delivery_info.id'), nullable=False)
    subtotal = Column(Float, nullable=False)
    shipping_fee = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False, default="cash_on_delivery")
    status = Column(String, default="pending_cod", index=True) # Added status field if needed
    created_at = Column(DateTime, default=datetime.utcnow, index=True) # Added index

    # Optional: Relationship back to User (Many-to-One)
    # owner = relationship("User", back_populates="orders") # Assumes User model has 'orders' relationship defined

    # Optional: Relationship to DeliveryInfo (Many-to-One)
    # delivery_details = relationship("DeliveryInfo", back_populates="orders")

    # Optional: Relationship to Order Items (One-to-Many)
    # items = relationship("OrderItem", back_populates="order") # Assumes OrderItem model exists