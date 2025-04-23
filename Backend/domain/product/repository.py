# app/product/repository.py
from sqlalchemy.orm import Session
from typing import List, Optional
from . import models, schemas

class ProductRepository:

    def get_product(self, db: Session, product_id: int) -> Optional[models.Product]:
        """Fetches a single product by its ID."""
        return db.query(models.Product).filter(models.Product.id == product_id).first()

    def get_products(self, db: Session, skip: int = 0, limit: int = 100) -> List[models.Product]:
        """Fetches a list of products with pagination."""
        return db.query(models.Product).offset(skip).limit(limit).all()

    def create_product(self, db: Session, product: schemas.ProductCreate) -> models.Product:
        """Creates a new product entry in the database."""
        image_url_str = str(product.image_url) if product.image_url else None
        db_product = models.Product(
            name=product.name,
            description=product.description,
            price=product.price,
            image_url=image_url_str,
            category=product.category,          # NEW
            specifications=product.specifications,  # NEW
            features=product.features           # NEW
        )
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

    def update_product(
        self, db: Session, product_id: int, product_update: schemas.ProductUpdate
    ) -> Optional[models.Product]:
        """Updates an existing product."""
        db_product = self.get_product(db, product_id)
        if not db_product:
            return None

        update_data = product_update.model_dump(exclude_unset=True) # Pydantic V2

        for key, value in update_data.items():
            # Convert HttpUrl to string before setting attribute
            if key == "image_url" and value is not None:
                value = str(value)
            # Allow setting fields back to None/null if provided in update_data
            setattr(db_product, key, value)

        db.add(db_product) # Add changes to the session
        db.commit()
        db.refresh(db_product)
        return db_product

    def delete_product(self, db: Session, product_id: int) -> Optional[models.Product]:
        """Deletes a product from the database."""
        db_product = self.get_product(db, product_id)
        if db_product:
            db.delete(db_product)
            db.commit()
            return db_product
        return None