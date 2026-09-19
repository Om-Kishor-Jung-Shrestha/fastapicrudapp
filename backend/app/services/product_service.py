import hashlib
from math import ceil
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.product_repository import ProductRepository
from app.dtos.product_dto import (
    ProductCreateDTO,
    ProductUpdateDTO,
    ProductResponseDTO,
    PaginatedProductsDTO,
)
from app.core.redis_client import cache_service

PRODUCT_ITEM_KEY = "product:{id}"
PRODUCT_LIST_PATTERN = "products:*"


class ProductService:
    def __init__(self, db: Session):
        self.repository = ProductRepository(db)

    def list_products(
        self,
        search: Optional[str],
        category_id: Optional[int],
        page: int,
        page_size: int,
    ) -> PaginatedProductsDTO:
        cache_key = self._build_list_cache_key(search, category_id, page, page_size)
        cached = cache_service.get(cache_key)
        if cached is not None:
            return PaginatedProductsDTO(**cached)

        items, total = self.repository.search(search, category_id, page, page_size)
        result = PaginatedProductsDTO(
            items=[ProductResponseDTO.model_validate(p) for p in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=max(ceil(total / page_size), 1),
        )
        cache_service.set(cache_key, result.model_dump())
        return result

    def get_product(self, product_id: int) -> ProductResponseDTO:
        cache_key = PRODUCT_ITEM_KEY.format(id=product_id)
        cached = cache_service.get(cache_key)
        if cached is not None:
            return ProductResponseDTO(**cached)

        product = self.repository.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        result = ProductResponseDTO.model_validate(product)
        cache_service.set(cache_key, result.model_dump())
        return result

    def create_product(self, dto: ProductCreateDTO) -> ProductResponseDTO:
        if self.repository.get_by_sku(dto.sku):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists")

        product = self.repository.create(dto)
        self._invalidate_list_cache()
        return ProductResponseDTO.model_validate(product)

    def update_product(self, product_id: int, dto: ProductUpdateDTO) -> ProductResponseDTO:
        product = self.repository.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        if dto.sku and dto.sku != product.sku and self.repository.get_by_sku(dto.sku):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists")

        updated = self.repository.update(product, dto)
        self._invalidate_list_cache()
        cache_service.delete(PRODUCT_ITEM_KEY.format(id=product_id))
        return ProductResponseDTO.model_validate(updated)

    def delete_product(self, product_id: int) -> None:
        product = self.repository.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        self.repository.delete(product)
        self._invalidate_list_cache()
        cache_service.delete(PRODUCT_ITEM_KEY.format(id=product_id))

    @staticmethod
    def _build_list_cache_key(
        search: Optional[str], category_id: Optional[int], page: int, page_size: int
    ) -> str:
        raw = f"{search or ''}|{category_id or ''}|{page}|{page_size}"
        digest = hashlib.md5(raw.encode()).hexdigest()
        return f"products:list:{digest}"

    @staticmethod
    def _invalidate_list_cache() -> None:
        cache_service.delete_pattern(PRODUCT_LIST_PATTERN)
