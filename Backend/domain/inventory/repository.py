# app/domain/inventory/repository.py
from sqlalchemy.orm import Session
from typing import Optional, List
from . import models, schemas

class InventoryRepository:

    def get_inventory_by_prod_id(self, db: Session, product_id: int) -> Optional[models.Inventory]:
        """Fetches inventory record by product ID."""
        return db.query(models.Inventory).filter(models.Inventory.prod_id == product_id).first()

    def get_all_inventory(self, db: Session, skip: int = 0, limit: int = 100) -> List[models.Inventory]:
         """Fetches all inventory records with pagination."""
         return db.query(models.Inventory).offset(skip).limit(limit).all()

    def create_inventory(self, db: Session, inventory: schemas.InventoryCreate) -> models.Inventory:
        """Creates a new inventory record."""
        db_inventory = models.Inventory(
            prod_id=inventory.prod_id,
            stock=inventory.stock
        )
        db.add(db_inventory)
        db.commit()
        db.refresh(db_inventory)
        return db_inventory

    def update_inventory(
        self, db: Session, product_id: int, inventory_update: schemas.InventoryUpdate
    ) -> Optional[models.Inventory]:
        """Updates stock for an inventory record identified by product ID."""
        db_inventory = self.get_inventory_by_prod_id(db, product_id)
        if db_inventory:
            db_inventory.stock = inventory_update.stock
            db.add(db_inventory)
            db.commit()
            db.refresh(db_inventory)
            return db_inventory
        return None

    def find_or_create_inventory(self, db: Session, product_id: int, initial_stock: int = 0) -> models.Inventory:
        """Finds inventory by product ID, or creates it if it doesn't exist."""
        db_inventory = self.get_inventory_by_prod_id(db, product_id)
        if not db_inventory:
            create_schema = schemas.InventoryCreate(prod_id=product_id, stock=initial_stock)
            db_inventory = self.create_inventory(db, create_schema)
        return db_inventory

    def delete_inventory_by_prod_id(self, db: Session, product_id: int) -> Optional[models.Inventory]:
         """Deletes inventory record by product ID."""
         db_inventory = self.get_inventory_by_prod_id(db, product_id)
         if db_inventory:
             db.delete(db_inventory)
             db.commit()
             return db_inventory
         return None