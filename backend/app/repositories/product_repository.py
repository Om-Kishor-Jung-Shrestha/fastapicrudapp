from typing import List, Optional, Tuple

from sqlalchemy import or_, func
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.dtos.product_dto import ProductCreateDTO, ProductUpdateDTO


class ProductRepository:
    """Handles all direct DB access for Product."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, product_id: int) -> Optional[Product]:
        return (
            self.db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.id == product_id)
            .first()
        )

    def get_by_sku(self, sku: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.sku == sku).first()

    def search(
        self,
        search: Optional[str],
        category_id: Optional[int],
        page: int,
        page_size: int,
    ) -> Tuple[List[Product], int]:
        query = self.db.query(Product).options(joinedload(Product.category))

        if search:
            pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Product.name.ilike(pattern),
                    Product.description.ilike(pattern),
                    Product.sku.ilike(pattern),
                )
            )

        if category_id is not None:
            query = query.filter(Product.category_id == category_id)

        total = query.with_entities(func.count(Product.id)).scalar() or 0

        items = (
            query.order_by(Product.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def create(self, dto: ProductCreateDTO) -> Product:
        product = Product(**dto.model_dump())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return self.get_by_id(product.id)

    def update(self, product: Product, dto: ProductUpdateDTO) -> Product:
        data = dto.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(product, field, value)
        self.db.commit()
        self.db.refresh(product)
        return self.get_by_id(product.id)

    def delete(self, product: Product) -> None:
        self.db.delete(product)
        self.db.commit()
