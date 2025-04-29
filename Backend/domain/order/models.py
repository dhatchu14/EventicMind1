
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from config.db import Base

class DeliveryInfo(Base):
    __tablename__ = "delivery_info"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    street = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip_code = Column(String, nullable=False)
    country = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    delivery_info_id = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)
    shipping_fee = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False, default="cash_on_delivery")
    created_at = Column(DateTime, default=datetime.utcnow)