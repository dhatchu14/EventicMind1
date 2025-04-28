# domain/order/schemas.py
import datetime
import enum
from pydantic import BaseModel, Field, constr, EmailStr # EmailStr if needed elsewhere
from typing import List, Optional

# --- Enums for API Data Validation ---
# These should generally match the DB Enums in models.py
class OrderStatus(str, enum.Enum):
    PLACED = "Placed"
    PROCESSING = "Processing"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"

class PaymentStatus(str, enum.Enum):
    PENDING = "Pending"
    SUCCESS = "Success" # Set by default in service/model for this flow
    FAILED = "Failed"
    REFUNDED = "Refunded"


# --- Delivery Schemas ---

class DeliveryBase(BaseModel):
    """Base schema for delivery information, used for creation."""
    # Frontend needs to combine firstName + lastName for this field
    name: str = Field(..., min_length=2, max_length=100, example="Jane Doe", description="Full name for delivery")
    # Frontend maps 'street' to this field
    address_line1: str = Field(..., max_length=255, example="123 Main St", description="Primary street address")
    address_line2: Optional[str] = Field(None, max_length=255, example="Apt 4B", description="Optional apartment, suite, etc.")
    city: str = Field(..., max_length=100, example="Anytown")
    state: str = Field(..., max_length=100, example="CA", description="State or Province")
    # Frontend maps 'zipCode' to this field
    # Relaxed pattern to allow various formats, adjust regex if needed
    zip_code: constr(max_length=20) = Field(..., example="90210", description="ZIP or Postal Code") # type: ignore
    # Frontend maps 'country' to this field
    country: str = Field(..., max_length=100, example="United States")
    # Frontend maps 'phone' to this field
    phone_number: constr(max_length=30) = Field(..., example="555-123-4567", description="Contact phone number") # type: ignore
    # Note: Email is not stored here, assumed part of the authenticated User's profile.

class DeliveryCreate(DeliveryBase):
    """Schema used for creating a new delivery record via API."""
    pass # Inherits all fields from DeliveryBase

class DeliveryRead(DeliveryBase):
    """Schema for reading/returning delivery information."""
    id: int
    user_id: int # Include user ID for reference
    created_at: datetime.datetime

    class Config:
        # Updated from orm_mode=True
        from_attributes = True # Allows creating schema instance from ORM model


# --- OrderItem Schemas ---

class OrderItemBase(BaseModel):
    """Base schema for order items."""
    product_id: int
    quantity: int = Field(..., gt=0) # Must be positive quantity
    # Price is included as it's captured at the time of order
    price_per_unit: float = Field(..., gt=0)

class OrderItemCreate(OrderItemBase):
    """Schema for creating order items (usually done internally by OrderService)."""
    # Typically includes order_id when used internally
    order_id: Optional[int] = None # Set internally by the service
    pass

class OrderItemRead(OrderItemBase):
    """Schema for reading/returning order item details."""
    id: int
    order_id: int
    # Consider adding product details here if needed for API response
    # E.g., requires joining Product in the repository query
    # product_name: Optional[str] = None
    # product_image_url: Optional[str] = None

    class Config:
        # Updated from orm_mode=True
        from_attributes = True


# --- Order Schemas ---

class OrderCreate(BaseModel):
    """Schema for the request body when creating a new order."""
    # Only the ID of the previously saved delivery info is needed
    delivery_id: int = Field(..., description="The ID of the saved Delivery address to use for this order.")

class OrderRead(BaseModel):
    """Schema for reading/returning full order details."""
    id: int
    user_id: int
    order_status: OrderStatus # Uses the API Enum
    payment_status: PaymentStatus # Uses the API Enum
    total_amount: float
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime]

    # Embed related data using their Read schemas
    delivery_info: DeliveryRead
    items: List[OrderItemRead]

    class Config:
        # Updated from orm_mode=True
        from_attributes = True
        # Keep other necessary config settings
        use_enum_values = True # Ensure enum values (strings) are used in JSON