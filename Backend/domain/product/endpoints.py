# app/product/endpoints.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from config.db import get_db
from . import schemas, service # Use the instantiated service

router = APIRouter(
    prefix="/products",
    tags=["Products"],
    responses={404: {"description": "Not found"}},
)

# Dependency injection for the service instance
def get_product_service() -> service.ProductService:
    return service.product_service

@router.post(
    "/",
    response_model=schemas.ProductRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
)
def create_product(
    product: schemas.ProductCreate = Body(...),
    db: Session = Depends(get_db),
    prod_service: service.ProductService = Depends(get_product_service)
):
    try:
        return prod_service.create_new_product(db=db, product=product)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error creating product: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error creating product")

@router.get(
    "/",
    response_model=List[schemas.ProductRead],
    summary="Retrieve all products",
)
def read_products(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of items to return"), # Increased limit example
    db: Session = Depends(get_db),
    prod_service: service.ProductService = Depends(get_product_service)
):
    products = prod_service.get_all_products(db, skip=skip, limit=limit)
    return products

@router.get(
    "/{product_id}",
    response_model=schemas.ProductRead,
    summary="Retrieve a single product by ID",
)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    prod_service: service.ProductService = Depends(get_product_service)
):
    db_product = prod_service.get_product_by_id(db, product_id=product_id)
    return db_product

@router.put(
    "/{product_id}",
    response_model=schemas.ProductRead,
    summary="Update an existing product",
)
def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate = Body(...),
    db: Session = Depends(get_db),
    prod_service: service.ProductService = Depends(get_product_service)
):
    updated_product = prod_service.update_existing_product(db=db, product_id=product_id, product_update=product_update)
    return updated_product

@router.delete(
    "/{product_id}",
    response_model=schemas.ProductRead,
    summary="Delete a product",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    prod_service: service.ProductService = Depends(get_product_service)
):
    deleted_product = prod_service.delete_product_by_id(db=db, product_id=product_id)
    return deleted_product