# app/product/service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from . import schemas, models
from .repository import ProductRepository

class ProductService:
    def __init__(self, repository: ProductRepository = ProductRepository()):
        self.repository = repository

    def get_product_by_id(self, db: Session, product_id: int) -> models.Product:
        """Retrieves a product by ID, raising 404 if not found."""
        db_product = self.repository.get_product(db, product_id)
        if db_product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return db_product

    def get_all_products(self, db: Session, skip: int = 0, limit: int = 100) -> List[models.Product]:
        """Retrieves a list of all products."""
        return self.repository.get_products(db, skip=skip, limit=limit)

    def create_new_product(self, db: Session, product: schemas.ProductCreate) -> models.Product:
        """Creates a new product."""
        # Optional: Add business logic like checking for duplicate names
        # existing_product = db.query(models.Product).filter(models.Product.name == product.name).first()
        # if existing_product:
        #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product name already exists")
        return self.repository.create_product(db=db, product=product)

    def update_existing_product(
        self, db: Session, product_id: int, product_update: schemas.ProductUpdate
    ) -> models.Product:
        """Updates an existing product, raising 404 if not found."""
        updated_product = self.repository.update_product(db, product_id, product_update)
        if updated_product is None:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return updated_product

    def delete_product_by_id(self, db: Session, product_id: int) -> models.Product:
        """Deletes a product by ID, raising 404 if not found."""
        deleted_product = self.repository.delete_product(db, product_id)
        if deleted_product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return deleted_product

# Instantiate the service
product_service = ProductService()