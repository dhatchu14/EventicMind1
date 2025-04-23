# app/domain/inventory/service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from . import schemas, models
from .repository import InventoryRepository
from domain.product.repository import ProductRepository # Correct import path

class InventoryService:
    def __init__(
        self,
        repository: InventoryRepository = InventoryRepository(),
        product_repository: ProductRepository = ProductRepository()
        ):
        self.repository = repository
        self.product_repository = product_repository

    def _check_product_exists(self, db: Session, product_id: int):
        """Helper to check if the referenced product exists."""
        product = self.product_repository.get_product(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found."
            )
        return product

    def get_stock_by_prod_id(self, db: Session, product_id: int) -> models.Inventory:
        """Gets inventory for a product, creating it with 0 stock if it doesn't exist."""
        self._check_product_exists(db, product_id)
        inventory = self.repository.find_or_create_inventory(db, product_id, initial_stock=0)
        return inventory

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[models.Inventory]:
         """Gets all inventory records."""
         return self.repository.get_all_inventory(db, skip=skip, limit=limit)

    def add_new_inventory(self, db: Session, inventory: schemas.InventoryCreate) -> models.Inventory:
        """Adds a new inventory record, ensuring product exists and inventory doesn't."""
        self._check_product_exists(db, inventory.prod_id)
        existing_inventory = self.repository.get_inventory_by_prod_id(db, inventory.prod_id)
        if existing_inventory:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Inventory for product id {inventory.prod_id} already exists. Use PUT to update."
            )
        if inventory.stock < 0:
             raise HTTPException(
                 status_code=status.HTTP_400_BAD_REQUEST,
                 detail="Initial stock cannot be negative."
             )
        return self.repository.create_inventory(db, inventory)

    # --- MODIFIED METHOD ---
    def update_stock_for_product(
        self, db: Session, product_id: int, inventory_update: schemas.InventoryUpdate
    ) -> models.Inventory:
        """
        Updates stock for a product.
        If inventory record exists, updates it.
        If inventory record does NOT exist, creates it with the specified stock.
        Raises 404 only if the PRODUCT itself doesn't exist.
        """
        # 1. Ensure the product itself exists. This raises 404 if not.
        self._check_product_exists(db, product_id)

        # 2. Try to update using the repository method (which first tries to get the item)
        #    We expect this might return None if the inventory record is missing.
        updated_inventory = self.repository.update_inventory(db, product_id, inventory_update)

        if updated_inventory is None:
            # 3. If update_inventory returned None, the inventory record didn't exist.
            #    Create it now using the provided stock level.
            print(f"Inventory record for prod_id {product_id} not found. Creating with stock {inventory_update.stock}.")
            create_schema = schemas.InventoryCreate(prod_id=product_id, stock=inventory_update.stock)
            # Use the repository's create method directly
            # This will commit the new record to the DB.
            updated_inventory = self.repository.create_inventory(db, create_schema)
            # If create_inventory somehow failed, it would raise its own exception.

        # 4. Return either the updated record or the newly created one.
        return updated_inventory
    # --- END MODIFIED METHOD ---

    def ensure_inventory_record_exists(self, db: Session, product_id: int):
         """Ensures an inventory record exists for a product, creating one with 0 stock if not."""
         # This should commit if it creates a new record
         self.repository.find_or_create_inventory(db, product_id, initial_stock=0)

    def delete_inventory_for_product(self, db: Session, product_id: int):
         deleted = self.repository.delete_inventory_by_prod_id(db, product_id)
         if not deleted:
              print(f"Warning: Tried to delete inventory for non-existent product_id {product_id} or it had no inventory.")
         return deleted


# Instantiate the service
inventory_service = InventoryService()


# --- Verification Step: Ensure Product Creation Logic is Solid ---
# Double-check your app/product/service.py ensures inventory creation.
# It should look something like this within the ProductService:

# from app.domain.inventory.service import inventory_service as inv_service # Import

# class ProductService:
#     # ... other methods ...
#     def create_new_product(self, db: Session, product: schemas.ProductCreate) -> models.Product:
#         # ... product creation logic ...
#         created_product = self.repository.create_product(db=db, product=product) # Commits product
#         if created_product:
#             try:
#                 print(f"Ensuring inventory record exists for new product ID: {created_product.id}")
#                 # This call should find or create the inventory record and commit
#                 inv_service.ensure_inventory_record_exists(db, created_product.id)
#             except Exception as e:
#                  # Log or handle potential errors during inventory creation
#                  print(f"ERROR: Failed to ensure inventory record for product {created_product.id}: {e}")
#                  # Consider if this error should be critical (raise HTTPException) or just logged
#         return created_product
#     # ... other methods ...