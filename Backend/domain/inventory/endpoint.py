# app/domain/inventory/endpoints.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from config.db import get_db
from . import schemas, service # Use the instantiated service

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
    responses={404: {"description": "Not found"}},
)

# Dependency injection for the service instance
def get_inventory_service() -> service.InventoryService:
    return service.inventory_service

@router.get(
    "/{prod_id}",
    response_model=schemas.InventoryOut,
    summary="Get current stock for a specific product",
    description="Retrieves the inventory details for a given product ID. If no inventory record exists, one might be created with 0 stock automatically.",
)
def read_inventory_for_product(
    prod_id: int,
    db: Session = Depends(get_db),
    inv_service: service.InventoryService = Depends(get_inventory_service)
):
    """
    Fetches inventory for a product ID.
    - Raises 404 if the *product* itself doesn't exist.
    - Returns inventory (possibly creating it with stock 0 if missing).
    """
    try:
        inventory = inv_service.get_stock_by_prod_id(db=db, product_id=prod_id)
        return inventory
    except HTTPException as e:
         # Re-raise known HTTP exceptions (like 404 for product not found)
        raise e
    except Exception as e:
         # Catch unexpected errors
        print(f"Error fetching inventory for prod_id {prod_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error fetching inventory")


@router.post(
    "/",
    response_model=schemas.InventoryOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new inventory entry",
    description="Manually creates an inventory record for a product. Use PUT to update existing records.",
)
def create_inventory_entry(
    inventory: schemas.InventoryCreate = Body(...),
    db: Session = Depends(get_db),
    inv_service: service.InventoryService = Depends(get_inventory_service)
):
    """
    Creates a new inventory record.
    - Requires `prod_id` and initial `stock`.
    - Raises 404 if the product doesn't exist.
    - Raises 400 if inventory for this product already exists.
    """
    try:
        created_inventory = inv_service.add_new_inventory(db=db, inventory=inventory)
        return created_inventory
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error creating inventory for prod_id {inventory.prod_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error creating inventory record")


@router.put(
    "/{prod_id}",
    response_model=schemas.InventoryOut,
    summary="Update stock for a specific product",
    description="Sets the stock level for a given product ID. The inventory record must already exist.",
)
def update_inventory_for_product(
    prod_id: int,
    inventory_update: schemas.InventoryUpdate = Body(...),
    db: Session = Depends(get_db),
    inv_service: service.InventoryService = Depends(get_inventory_service)
):
    """
    Updates the stock count for an existing inventory record.
    - Requires the new `stock` value in the body.
    - Raises 404 if the product or its inventory record doesn't exist.
    """
    try:
        updated_inventory = inv_service.update_stock_for_product(
            db=db, product_id=prod_id, inventory_update=inventory_update
        )
        return updated_inventory
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error updating inventory for prod_id {prod_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error updating inventory")

# Endpoint to get all inventory
@router.get(
    "/", # Matches GET /inventory/
    response_model=List[schemas.InventoryOut],
    summary="Get all inventory records",
    description="Retrieves a list of all inventory records, primarily for admin overview.",
)
def read_all_inventory(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    # --- UPDATED LIMIT VALIDATION ---
    # Increased maximum limit to 1000 (adjust if needed)
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of items to return"),
    db: Session = Depends(get_db),
    inv_service: service.InventoryService = Depends(get_inventory_service)
):
    """ Fetches all inventory records with pagination. """
    try:
        inventory_list = inv_service.get_all(db=db, skip=skip, limit=limit)
        return inventory_list
    except Exception as e:
        # Catch unexpected errors during fetch
        print(f"Error fetching all inventory: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error fetching inventory list")