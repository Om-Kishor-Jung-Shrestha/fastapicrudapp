import enum
from datetime import datetime

from sqlalchemy import String, DateTime, Boolean, Enum, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuthProvider(str, enum.Enum):
    LOCAL = "local"
    GOOGLE = "google"


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False, default="")
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER, nullable=False)

    # Primary signup method. A local user can ADDITIONALLY link a Google
    # account later -- google_id / google_email get populated at that point.
    auth_provider: Mapped[AuthProvider] = mapped_column(
        Enum(AuthProvider), default=AuthProvider.LOCAL, nullable=False
    )
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    google_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    @property
    def google_linked(self) -> bool:
        return self.google_id is not None
