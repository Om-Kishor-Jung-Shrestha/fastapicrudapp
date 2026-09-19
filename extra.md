Yes. If by **“here do depends”** you mean your FastAPI `Depends()` setup, then for your controller/service/repository architecture, keep dependency wiring separate and use `Depends()` mainly at the **controller/router boundary**.

For example:

```text
backend/
└── app/
    ├── __init__.py
    ├── main.py
    │
    ├── dependencies.py
    │
    ├── controllers/
    │   ├── __init__.py
    │   └── product_controller.py
    │
    ├── services/
    │   ├── __init__.py
    │   └── product_service.py
    │
    ├── repositories/
    │   ├── __init__.py
    │   └── product_repository.py
    │
    ├── models/
    │   ├── __init__.py
    │   └── product.py
    │
    └── config/
        ├── __init__.py
        └── settings.py
```

### `dependencies.py`

```python
from typing import Annotated

from fastapi import Depends

from app.repositories.product_repository import ProductRepository
from app.services.product_service import ProductService


def get_product_repository() -> ProductRepository:
    return ProductRepository()


def get_product_service(
    repository: Annotated[
        ProductRepository,
        Depends(get_product_repository),
    ],
) -> ProductService:
    return ProductService(repository)
```

### Controller

```python
from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies import get_product_service
from app.services.product_service import ProductService

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.get("/")
def get_products(
    service: Annotated[
        ProductService,
        Depends(get_product_service),
    ],
):
    return service.get_products()
```

The dependency chain becomes:

```text
HTTP Request
     │
     ▼
Controller
     │
     │ Depends()
     ▼
ProductService
     │
     ▼
ProductRepository
     │
     ▼
Database
```

### Where `__init__.py` fits

You can keep:

```text
controllers/__init__.py
services/__init__.py
repositories/__init__.py
models/__init__.py
```

These are **package files**, not dependency files.

`Depends()` itself should not be put into every `__init__.py`.

For a small-to-medium FastAPI CRUD app, I'd use:

```text
app/
├── dependencies.py       # dependency wiring
├── controllers/          # HTTP/API layer
├── services/             # business/use-case layer
├── repositories/         # persistence layer
└── models/               # SQLAlchemy/Pydantic models as appropriate
```

That keeps the architecture pragmatic without creating an unnecessary `domain/`/`infrastructure/` layer just for the sake of structure.
