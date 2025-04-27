# domain/cart/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List

# --- Import the Product schema you want to nest ---
# Make sure this import path is correct for your project structure
# and that ProductRead is defined in domain/product/schemas.py
# Example definition of ProductRead is below if you don't have one
try:
    from domain.product.schemas import ProductRead
except ImportError:
    # Fallback or placeholder if the file/schema doesn't exist yet
    # Define a basic ProductRead here for the example to work
    print("Warning: domain.product.schemas.ProductRead not found. Using a basic placeholder.")
    class ProductRead(BaseModel):
        id: int
        name: str = "Product Name Placeholder"
        price: float = 0.0
        image_url: Optional[str] = None

        class Config:
            from_attributes = True


# Base schema with common fields
class CartItemBase(BaseModel):
    prod_id: int = Field(..., example=1, description="ID of the product")
    quantity: int = Field(..., gt=0, example=2, description="Quantity of the product (must be > 0)")

# Schema for adding/updating items in the cart (input)
class CartItemCreate(CartItemBase):
    pass # Input doesn't need product details, just the ID

# --- Schema for representing a single item IN THE CART (output) ---
# This schema defines what is SENT BACK to the frontend for each cart item
class CartItemOut(CartItemBase):
    id: int # Include cart item ID for potential frontend use (e.g., keys)

    # *** THIS IS THE KEY CHANGE ***
    # Include the nested product details using the ProductRead schema.
    # Pydantic will use the 'product' relationship from the CartItem model.
    product: ProductRead

    class Config:
        # Enable reading attributes directly from ORM/model objects
        from_attributes = True # Pydantic V2 (use orm_mode=True in V1)


# --- Schema for representing the USER'S ENTIRE CART (output for GET /cart/) ---
# This schema defines the overall structure of the response for the GET /cart/ endpoint
class CartOut(BaseModel):
    # The 'items' list will now contain objects matching the CartItemOut structure
    items: List[CartItemOut] = Field(..., description="List of items in the cart, including product details")

    # Optional: Add calculated totals if needed from backend
    # total_cost: Optional[float] = Field(None, example=149.98)
    # item_count: Optional[int] = Field(None, example=16)

    class Config:
        # Enable reading attributes directly from ORM/model objects if you add
        # calculated fields like total_cost/item_count directly to a CartOut instance
        # in your service layer before returning.
        from_attributes = True # Pydantic V2 (use orm_mode=True in V1)

# Example definition of ProductRead (if not already defined in domain/product/schemas.py)
# You should ideally have this in its own file (domain/product/schemas.py)
# class ProductRead(BaseModel):
#     id: int
#     name: str
#     price: float
#     image_url: Optional[str] = None # Adjust field name if needed
#
#     class Config:
#         from_attributes = True