# backend/domain/inventory/endpoints.py # Corrected path assumption
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional

# Local imports (ensure these paths are correct relative to this file)
from . import schemas
from . import service # Assumes service.py contains InventoryService and an instance named inventory_service
from config.db import get_db # Import database session dependency

# --- Define the Router WITHOUT the prefix ---
router = APIRouter(
    # prefix="/inventory", # REMOVED: Prefix will be added in main.py
    tags=["Inventory"],
    responses={404: {"description": "Not found"}}, # Keep general 404 or make more specific
)
# ---------------------------------------------

# Dependency function to get the inventory service instance
def get_inventory_service() -> service.InventoryService:
    return service.inventory_service

# Endpoint to get all inventory (Now correctly maps to GET /inventory/)
@router.get(
    "/", # Path relative to the prefix defined in main.py
    response_model=List[schemas.InventoryOut],
    summary="Get all inventory records",
    description="Retrieves a list of all inventory records, primarily for admin overview.",
)
def read_all_inventory(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of items to return"),
    db: Session = Depends(get_db),
    inv_service: service.InventoryService = Depends(get_inventory_service)
):
    """ Fetches all inventory records with pagination. """
    try:
        inventory_list = inv_service.get_all(db=db, skip=skip, limit=limit)
        return inventory_list
    except Exception as e:
        print(f"Error fetching all inventory: {e}") # Replace with proper logging
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error fetching inventory list")

@router.get(
    "/{prod_id}", # Path relative to prefix -> final path is /inventory/{prod_id}
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
    - Raises 404 if the *product* itself doesn't exist (handled by service).
    - Returns inventory (possibly creating it with stock 0 if missing).
    """
    try:
        inventory = inv_service.get_stock_by_prod_id(db=db, product_id=prod_id)
        return inventory
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching inventory for prod_id {prod_id}: {e}") # Replace with proper logging
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error fetching inventory")


@router.post(
    "/", # Path relative to prefix -> final path is /inventory/ (overloaded with GET all)
         # Consider changing path to "/add" or similar if POST "/" is ambiguous
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
    - Raises 400 if inventory for this product already exists (handled by service).
    """
    try:
        created_inventory = inv_service.add_new_inventory(db=db, inventory=inventory)
        return created_inventory
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error creating inventory for prod_id {inventory.prod_id}: {e}") # Replace with proper logging
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error creating inventory record")


@router.put(
    "/{prod_id}", # Path relative to prefix -> final path is /inventory/{prod_id}
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
    - Raises 404 if the product or its inventory record doesn't exist (handled by service).
    """
    try:
        updated_inventory = inv_service.update_stock_for_product(
            db=db, product_id=prod_id, inventory_update=inventory_update
        )
        return updated_inventory
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error updating inventory for prod_id {prod_id}: {e}") # Replace with proper logging
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error updating inventory")