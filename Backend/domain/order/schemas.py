# File: domain/order/schemas.py
from pydantic import BaseModel, EmailStr, ConfigDict # Import ConfigDict for V2
from datetime import datetime
from typing import Optional # Import Optional if updated_at can be null

# --- Base Schemas (Common fields) ---

class DeliveryInfoBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    street: str
    city: str
    state: str
    zip_code: str
    country: str

# --- Schemas for Creating Data ---

class DeliveryInfoCreate(DeliveryInfoBase):
    pass

class OrderCreate(BaseModel):
    delivery_info: DeliveryInfoCreate
    subtotal: float
    shipping_fee: float
    total: float

# --- Schemas for Responding to Client ---

class DeliveryInfoResponse(DeliveryInfoBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    delivery_info_id: int
    subtotal: float
    shipping_fee: float
    total: float
    payment_method: str
    status: str  # <--- ADD THIS LINE! (Make sure type matches your DB model, usually str)
    created_at: datetime
    updated_at: Optional[datetime] = None # Add if your Order model has updated_at

    # You might also want to add user_id if relevant for the response
    user_id: int

    model_config = ConfigDict(from_attributes=True)