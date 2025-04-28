# backend/domain/product/endpoints.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional

# Local imports (ensure these paths are correct relative to this file)
from . import schemas
from . import service # Assumes service.py contains ProductService and an instance named product_service
from config.db import get_db # Import database session dependency

import time # For logging request duration if needed

# --- Define the Router WITHOUT the prefix ---
router = APIRouter(
    # prefix="/products", # REMOVED: Prefix will be added in main.py
    tags=["Products"],
    responses={404: {"description": "Product not found"}}, # More specific 404 response
)
# ---------------------------------------------

# Dependency function to get the product service instance
# This promotes decoupling and testability
def get_product_service() -> service.ProductService:
    # Return the singleton instance created in service.py (or handle instantiation here)
    return service.product_service

@router.post(
    "/", # Path relative to the prefix defined in main.py (e.g., "/products")
    response_model=schemas.ProductRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
    description="Adds a new product to the catalog."
)
def create_product(
    # Use the Pydantic schema for request body validation
    product: schemas.ProductCreate = Body(...),
    # Inject database session
    db: Session = Depends(get_db),
    # Inject product service instance
    prod_service: service.ProductService = Depends(get_product_service)
):
    """
    Endpoint to create a new product.
    - Requires product data conforming to ProductCreate schema in the request body.
    - Returns the created product details including its ID.
    """
    request_received_time = time.time()
    print(f"[{request_received_time:.4f}] Endpoint: Received create_product request for '{product.name}'")
    try:
        start_service_call = time.time()
        # Delegate creation logic to the service layer
        created_product = prod_service.create_new_product(db=db, product=product)
        end_service_call = time.time()
        service_duration = end_service_call - start_service_call
        total_duration = end_service_call - request_received_time
        print(f"[{end_service_call:.4f}] Endpoint: Finished create_product service call. Service duration: {service_duration:.4f}s")
        print(f"[{end_service_call:.4f}] Endpoint: Total request duration: {total_duration:.4f}s")
        return created_product
    except HTTPException as e:
        # Re-raise exceptions with specific HTTP status codes
        raise e
    except Exception as e:
        # Catch-all for unexpected errors
        error_time = time.time()
        # Use proper logging in production instead of print
        print(f"[{error_time:.4f}] Endpoint: Unexpected error creating product: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred while creating the product."
        )

@router.get(
    "/", # Path relative to the prefix defined in main.py (e.g., "/products")
    response_model=List[schemas.ProductRead],
    summary="Retrieve all products",
    description="Gets a list of all available products, with optional pagination."
)
def read_products(
    # Query parameters for pagination
    skip: int = Query(0, ge=0, description="Number of product records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of product records to return"),
    # Inject dependencies
    db: Session = Depends(get_db),
    prod_service: service.ProductService = Depends(get_product_service)
):
    """
    Endpoint to retrieve a list of products.
    - Supports pagination using `skip` and `limit` query parameters.
    - Returns a list of products conforming to the ProductRead schema.
    """
    # Delegate fetching logic to the service layer
    products = prod_service.get_all_products(db, skip=skip, limit=limit)
    return products

@router.get(
    "/{product_id}", # Path relative to prefix -> final path is /products/{product_id}
    response_model=schemas.ProductRead,
    summary="Retrieve a single product by ID",
    description="Gets the details of a specific product using its unique ID."
)
def read_product(
    # Path parameter validation
    product_id: int,
    # Inject dependencies
    db: Session = Depends(get_db),
    prod_service: service.ProductService = Depends(get_product_service)
):
    """
    Endpoint to retrieve a specific product by its ID.
    - Raises 404 if the product with the given ID is not found (handled by service).
    - Returns the product details.
    """
    # Delegate fetching logic to the service layer
    # Service layer should handle the 404 exception if not found
    db_product = prod_service.get_product_by_id(db, product_id=product_id)
    return db_product

@router.put(
    "/{product_id}", # Path relative to prefix -> final path is /products/{product_id}
    response_model=schemas.ProductRead,
    summary="Update an existing product",
    description="Updates the details of an existing product identified by its ID."
)
def update_product(
    # Path parameter
    product_id: int,
    # Request body with fields to update
    product_update: schemas.ProductUpdate = Body(...),
    # Inject dependencies
    db: Session = Depends(get_db),
    prod_service: service.ProductService = Depends(get_product_service)
):
    """
    Endpoint to update an existing product.
    - Requires the product ID in the path.
    - Requires product update data in the request body.
    - Raises 404 if the product is not found (handled by service).
    - Returns the updated product details.
    """
    # Delegate update logic to the service layer
    updated_product = prod_service.update_existing_product(
        db=db, product_id=product_id, product_update=product_update
    )
    return updated_product

@router.delete(
    "/{product_id}", # Path relative to prefix -> final path is /products/{product_id}
    response_model=schemas.ProductRead, # Typically returns the deleted item
    summary="Delete a product",
    description="Deletes a product identified by its ID."
)
def delete_product(
    # Path parameter
    product_id: int,
    # Inject dependencies
    db: Session = Depends(get_db),
    prod_service: service.ProductService = Depends(get_product_service)
):
    """
    Endpoint to delete a product by its ID.
    - Raises 404 if the product is not found (handled by service).
    - Returns the details of the product that was deleted.
    """
    # Delegate deletion logic to the service layer
    deleted_product = prod_service.delete_product_by_id(db=db, product_id=product_id)
    return deleted_product