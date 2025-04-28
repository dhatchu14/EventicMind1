# domain/cart/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List

# --- Import the Product schema ---
try:
    from domain.product.schemas import ProductRead
except ImportError:
    print("Warning: domain.product.schemas.ProductRead not found. Using a basic placeholder.")
    class ProductRead(BaseModel):
        id: int
        name: str = "Product Name Placeholder"
        price: float = 0.0
        image_url: Optional[str] = None
        class Config: from_attributes = True

# Base schema
class CartItemBase(BaseModel):
    prod_id: int = Field(..., example=1, description="ID of the product")
    quantity: int = Field(..., gt=0, example=2, description="Quantity of the product (must be > 0)")

# Schema for adding items
class CartItemCreate(CartItemBase):
    pass

# *** ADD THIS SCHEMA ***
class CartItemUpdate(BaseModel):
    """Schema for updating the quantity of an item in the cart via PUT."""
    # Use Field validation for non-negative quantity (allowing 0 to remove)
    quantity: int = Field(..., ge=0, description="The desired new quantity for the item (0 to remove).")

    class Config:
         from_attributes = True
# ************************

# Schema for returning items
class CartItemOut(CartItemBase):
    id: int
    product: ProductRead
    class Config:
        from_attributes = True

# Schema for returning the whole cart
class CartOut(BaseModel):
    items: List[CartItemOut] = Field(..., description="List of items in the cart, including product details")
    # Optional totals
    # total_cost: Optional[float] = Field(None, example=149.98)
    # item_count: Optional[int] = Field(None, example=16)
    class Config:
        from_attributes = True