from typing import Optional

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.product_service import ProductService
from app.dtos.product_dto import (
    ProductCreateDTO,
    ProductUpdateDTO,
    ProductResponseDTO,
    PaginatedProductsDTO,
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=PaginatedProductsDTO)
def list_products(
    search: Optional[str] = Query(None, description="Search by name, description or SKU"),
    category_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return ProductService(db).list_products(search, category_id, page, page_size)


@router.get("/{product_id}", response_model=ProductResponseDTO)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return ProductService(db).get_product(product_id)


@router.post("", response_model=ProductResponseDTO, status_code=status.HTTP_201_CREATED)
def create_product(
    dto: ProductCreateDTO, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return ProductService(db).create_product(dto)


@router.put("/{product_id}", response_model=ProductResponseDTO)
def update_product(
    product_id: int,
    dto: ProductUpdateDTO,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ProductService(db).update_product(product_id, dto)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    ProductService(db).delete_product(product_id)
