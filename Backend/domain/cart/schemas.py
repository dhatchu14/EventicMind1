# domain/cart/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List
# Optional: Import product schema if you want to nest product details
# from domain.product.schemas import ProductRead

# Base schema with common fields
class CartItemBase(BaseModel):
    prod_id: int = Field(..., example=1, description="ID of the product")
    quantity: int = Field(..., gt=0, example=2, description="Quantity of the product (must be > 0)")

# Schema for adding/updating items in the cart (input)
class CartItemCreate(CartItemBase):
    pass # Same as base for this endpoint structure

# Schema for representing a single item in the cart (output)
class CartItemOut(CartItemBase):
    id: int # Include cart item ID for potential frontend use (e.g., keys)
    # Optional: Include product details
    # product: ProductRead

    class Config:
        from_attributes = True # Pydantic V2 (orm_mode in V1)

# Schema for representing the user's entire cart (output for GET /cart/)
class CartOut(BaseModel):
    items: List[CartItemOut] = Field(..., description="List of items in the cart")
    # Optional: Add calculated total if done on backend
    # total_cost: float = Field(..., example=149.98)