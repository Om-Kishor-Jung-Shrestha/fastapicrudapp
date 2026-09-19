from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.category import Category
from app.dtos.category_dto import CategoryCreateDTO, CategoryUpdateDTO


class CategoryRepository:
    """Handles all direct DB access for Category."""

    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[Category]:
        return self.db.query(Category).order_by(Category.name.asc()).all()

    def get_by_id(self, category_id: int) -> Optional[Category]:
        return self.db.query(Category).filter(Category.id == category_id).first()

    def get_by_name(self, name: str) -> Optional[Category]:
        return self.db.query(Category).filter(Category.name == name).first()

    def create(self, dto: CategoryCreateDTO) -> Category:
        category = Category(name=dto.name, description=dto.description)
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update(self, category: Category, dto: CategoryUpdateDTO) -> Category:
        data = dto.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(category, field, value)
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete(self, category: Category) -> None:
        self.db.delete(category)
        self.db.commit()
