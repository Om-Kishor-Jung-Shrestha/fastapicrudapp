from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models.user import User
from app.services.category_service import CategoryService
from app.dtos.category_dto import CategoryCreateDTO, CategoryUpdateDTO, CategoryResponseDTO

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponseDTO])
def list_categories(db: Session = Depends(get_db)):
    return CategoryService(db).list_categories()


@router.get("/{category_id}", response_model=CategoryResponseDTO)
def get_category(category_id: int, db: Session = Depends(get_db)):
    return CategoryService(db).get_category(category_id)


@router.post("", response_model=CategoryResponseDTO, status_code=status.HTTP_201_CREATED)
def create_category(
    dto: CategoryCreateDTO, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)
):
    return CategoryService(db).create_category(dto)


@router.put("/{category_id}", response_model=CategoryResponseDTO)
def update_category(
    category_id: int,
    dto: CategoryUpdateDTO,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return CategoryService(db).update_category(category_id, dto)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)
):
    CategoryService(db).delete_category(category_id)
