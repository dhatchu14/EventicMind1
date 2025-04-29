# domain/cart/schemas.py
from pydantic import BaseModel, Field, ConfigDict # Use ConfigDict for Pydantic v2
from typing import Optional, List

# --- Import the Product schema ---
try:
    # Make sure this path is correct and ProductRead exists and is correctly defined
    from domain.product.schemas import ProductRead
except ImportError:
    print("Warning: domain.product.schemas.ProductRead not found. Using a basic placeholder.")
    # Ensure placeholder matches expected fields for validation
    class ProductRead(BaseModel):
        id: int
        name: str = "Unknown Product"
        price: float = 0.0
        image_url: Optional[str] = None
        # Add other fields expected by your frontend/logic if necessary

        # Use model_config for Pydantic v2
        model_config = ConfigDict(from_attributes=True)
        # class Config: # Pydantic v1
        #    orm_mode = True

# Base schema for Cart Item data
class CartItemBase(BaseModel):
    prod_id: int = Field(..., example=1, description="ID of the product")

# Schema for adding items (requires quantity > 0)
class CartItemCreate(CartItemBase):
    quantity: int = Field(..., gt=0, example=1, description="Quantity to add (must be > 0)")

# Schema for updating the quantity of an item via PUT (allows 0 for potential removal logic *in service*, though discouraged now)
class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, description="The desired *new* total quantity for the item.")

    # Use model_config for Pydantic v2
    model_config = ConfigDict(from_attributes=True)
    # class Config: # Pydantic v1
    #    orm_mode = True

# Schema for returning items (includes nested product)
class CartItemOut(CartItemBase):
    id: int
    quantity: int # Override from Base if needed, ensure it's present
    product: ProductRead # Expects nested product data

    # Use model_config for Pydantic v2
    model_config = ConfigDict(from_attributes=True)
    # class Config: # Pydantic v1
    #    orm_mode = True

# Schema for returning the whole cart
class CartOut(BaseModel):
    items: List[CartItemOut] = Field(..., description="List of items in the cart, including product details")
    # Optional calculated fields can be added later if needed
    # total_cost: Optional[float] = None
    # item_count: Optional[int] = None

    # Use model_config for Pydantic v2
    model_config = ConfigDict(from_attributes=True)
    # class Config: # Pydantic v1
    #    orm_mode = True