# app/product/schemas.py
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional

# Base properties shared by all schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, example="Wireless Headphones")
    description: Optional[str] = Field(None, example="High-quality noise-cancelling headphones")
    price: float = Field(..., gt=0, example=199.99)
    image_url: Optional[HttpUrl] = Field(None, example="https://example.com/image.jpg")
    category: Optional[str] = Field(None, example="Electronics > Audio") # NEW
    specifications: Optional[str] = Field(None, example="Color: Black\nWeight: 250g") # NEW
    features: Optional[str] = Field(None, example="Active Noise Cancellation\n30-Hour Battery") # NEW

# Properties required for creating a product (input)
class ProductCreate(ProductBase):
   pass # Inherits all from ProductBase

# Properties required for updating a product (input)
# All fields are optional for partial updates
class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, example="Updated Headphones")
    description: Optional[str] = Field(None, example="Updated description")
    price: Optional[float] = Field(None, gt=0, example=210.50)
    image_url: Optional[HttpUrl] = Field(None, example="https://example.com/new_image.jpg")
    category: Optional[str] = Field(None, example="Electronics > Accessories") # NEW
    specifications: Optional[str] = Field(None, example="Color: White\nWeight: 245g") # NEW
    features: Optional[str] = Field(None, example="Improved ANC\n40-Hour Battery") # NEW

# Properties returned when reading a product (output)
class ProductRead(ProductBase):
    id: int = Field(..., example=1)

    class Config:
        from_attributes = True # Pydantic V2 (use orm_mode = True for V1)