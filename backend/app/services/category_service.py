from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.category_repository import CategoryRepository
from app.dtos.category_dto import CategoryCreateDTO, CategoryUpdateDTO, CategoryResponseDTO
from app.core.redis_client import cache_service

CATEGORY_LIST_KEY = "categories:all"
CATEGORY_ITEM_KEY = "category:{id}"


class CategoryService:
    def __init__(self, db: Session):
        self.repository = CategoryRepository(db)

    def list_categories(self) -> List[CategoryResponseDTO]:
        cached = cache_service.get(CATEGORY_LIST_KEY)
        if cached is not None:
            return [CategoryResponseDTO(**item) for item in cached]

        categories = self.repository.get_all()
        result = [CategoryResponseDTO.model_validate(c) for c in categories]
        cache_service.set(CATEGORY_LIST_KEY, [r.model_dump() for r in result])
        return result

    def get_category(self, category_id: int) -> CategoryResponseDTO:
        cache_key = CATEGORY_ITEM_KEY.format(id=category_id)
        cached = cache_service.get(cache_key)
        if cached is not None:
            return CategoryResponseDTO(**cached)

        category = self.repository.get_by_id(category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

        result = CategoryResponseDTO.model_validate(category)
        cache_service.set(cache_key, result.model_dump())
        return result

    def create_category(self, dto: CategoryCreateDTO) -> CategoryResponseDTO:
        if self.repository.get_by_name(dto.name):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists")

        category = self.repository.create(dto)
        self._invalidate_list_cache()
        return CategoryResponseDTO.model_validate(category)

    def update_category(self, category_id: int, dto: CategoryUpdateDTO) -> CategoryResponseDTO:
        category = self.repository.get_by_id(category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

        if dto.name and dto.name != category.name and self.repository.get_by_name(dto.name):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists")

        updated = self.repository.update(category, dto)
        self._invalidate_list_cache()
        cache_service.delete(CATEGORY_ITEM_KEY.format(id=category_id))
        return CategoryResponseDTO.model_validate(updated)

    def delete_category(self, category_id: int) -> None:
        category = self.repository.get_by_id(category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

        self.repository.delete(category)
        self._invalidate_list_cache()
        cache_service.delete(CATEGORY_ITEM_KEY.format(id=category_id))
        cache_service.delete_pattern("products:*")

    def _invalidate_list_cache(self) -> None:
        cache_service.delete(CATEGORY_LIST_KEY)
