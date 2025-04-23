# app/domain/inventory/schemas.py
from pydantic import BaseModel, Field

# Base Schema
class InventoryBase(BaseModel):
    prod_id: int = Field(..., example=1, description="The ID of the related product")
    stock: int = Field(..., ge=0, example=50, description="Current stock quantity (must be non-negative)")

# Schema for Creating Inventory (requires prod_id and stock)
class InventoryCreate(InventoryBase):
    pass

# Schema for Updating Inventory (only requires stock)
class InventoryUpdate(BaseModel):
    stock: int = Field(..., ge=0, example=75, description="New stock quantity (must be non-negative)")

# Schema for Reading/Outputting Inventory (returns prod_id and stock)
class InventoryOut(BaseModel):
    prod_id: int
    stock: int

    class Config:
        from_attributes = True # Pydantic V2 (orm_mode in V1)