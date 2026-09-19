from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class CategoryBaseDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)


class CategoryCreateDTO(CategoryBaseDTO):
    pass


class CategoryUpdateDTO(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)


class CategoryResponseDTO(CategoryBaseDTO):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
