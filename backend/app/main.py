from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.seed import seed_default_users
from app.models import product, category, user, otp, otp_invitation  # noqa: F401
from app.controllers import (
    product_controller,
    category_controller,
    upload_controller,
    auth_controller,
    invitation_controller,
)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_users(db)
    finally:
        db.close()


app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth_controller.router, prefix=settings.API_V1_PREFIX)
app.include_router(invitation_controller.router, prefix=settings.API_V1_PREFIX)
app.include_router(product_controller.router, prefix=settings.API_V1_PREFIX)
app.include_router(category_controller.router, prefix=settings.API_V1_PREFIX)
app.include_router(upload_controller.router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health_check():
    return {"status": "ok"}
