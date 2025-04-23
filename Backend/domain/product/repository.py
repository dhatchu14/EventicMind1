# app/product/repository.py
from sqlalchemy.orm import Session
from typing import List, Optional
from . import models, schemas
import time # <--- Import time

class ProductRepository:

    def get_product(self, db: Session, product_id: int) -> Optional[models.Product]:
        """Fetches a single product by its ID."""
        return db.query(models.Product).filter(models.Product.id == product_id).first()

    def get_products(self, db: Session, skip: int = 0, limit: int = 100) -> List[models.Product]:
        """Fetches a list of products with pagination."""
        return db.query(models.Product).offset(skip).limit(limit).all()

    def create_product(self, db: Session, product: schemas.ProductCreate) -> models.Product:
        """Creates a new product entry in the database."""
        start_repo_time = time.time() # <--- Capture start of repo method
        print(f"[{start_repo_time:.4f}] Repo: Starting create_product for '{product.name}'")

        image_url_str = str(product.image_url) if product.image_url else None
        db_product = models.Product(
            name=product.name,
            description=product.description,
            price=product.price,
            image_url=image_url_str,
            category=product.category,
            specifications=product.specifications,
            features=product.features
        )

        add_start_time = time.time()
        print(f"[{add_start_time:.4f}] Repo: Before db.add()") # <--- Log before add
        db.add(db_product)
        add_end_time = time.time()
        print(f"[{add_end_time:.4f}] Repo: After db.add(). Duration: {add_end_time - add_start_time:.4f}s") # <--- Log after add

        commit_start_time = time.time()
        print(f"[{commit_start_time:.4f}] Repo: Before db.commit()") # <--- Log before commit
        db.commit()
        commit_end_time = time.time()
        print(f"[{commit_end_time:.4f}] Repo: After db.commit(). Duration: {commit_end_time - commit_start_time:.4f}s") # <--- Log after commit + duration

        refresh_start_time = time.time()
        print(f"[{refresh_start_time:.4f}] Repo: Before db.refresh()") # <--- Log before refresh
        db.refresh(db_product)
        refresh_end_time = time.time()
        print(f"[{refresh_end_time:.4f}] Repo: After db.refresh(). Duration: {refresh_end_time - refresh_start_time:.4f}s") # <--- Log after refresh + duration

        end_repo_time = time.time()
        print(f"[{end_repo_time:.4f}] Repo: Finished create_product. Total repo duration: {end_repo_time - start_repo_time:.4f}s") # <--- Log total repo duration
        return db_product

    def update_product(
        self, db: Session, product_id: int, product_update: schemas.ProductUpdate
    ) -> Optional[models.Product]:
        """Updates an existing product."""
        # (Optional: Add similar timing logs here if needed for updates)
        db_product = self.get_product(db, product_id)
        if not db_product:
            return None

        update_data = product_update.model_dump(exclude_unset=True) # Pydantic V2

        for key, value in update_data.items():
            if key == "image_url" and value is not None:
                value = str(value)
            setattr(db_product, key, value)

        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

    def delete_product(self, db: Session, product_id: int) -> Optional[models.Product]:
        """Deletes a product from the database."""
         # (Optional: Add similar timing logs here if needed for deletes)
        db_product = self.get_product(db, product_id)
        if db_product:
            db.delete(db_product)
            db.commit()
            return db_product
        return None