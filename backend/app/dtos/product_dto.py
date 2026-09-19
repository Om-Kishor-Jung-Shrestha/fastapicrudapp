from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict

from app.dtos.category_dto import CategoryResponseDTO


class ProductBaseDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    sku: str = Field(..., min_length=1, max_length=64)
    price: float = Field(..., ge=0)
    stock_quantity: int = Field(0, ge=0)
    image_url: Optional[str] = None
    category_id: Optional[int] = None


class ProductCreateDTO(ProductBaseDTO):
    pass


class ProductUpdateDTO(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    sku: Optional[str] = Field(None, min_length=1, max_length=64)
    price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    category_id: Optional[int] = None


class ProductResponseDTO(ProductBaseDTO):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponseDTO] = None


class PaginatedProductsDTO(BaseModel):
    items: List[ProductResponseDTO]
    total: int
    page: int
    page_size: int
    total_pages: int
