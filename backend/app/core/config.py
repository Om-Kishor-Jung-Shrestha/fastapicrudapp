from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Product CRUD API"
    API_V1_PREFIX: str = "/api"

    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "products_db"

    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    CACHE_TTL_SECONDS: int = 300

    UPLOAD_DIR: str = "/app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://frontend:3000"]

    # Auth / JWT
    JWT_SECRET: str = "change-this-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Frontend base URL, used for OAuth + email redirect links
    FRONTEND_URL: str = "http://localhost:3000"
    BASE_URL: str = "http://localhost:3001"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_CALLBACK_URL: str = "http://localhost:3001/api/auth/google/callback"

    # SMTP / email (OTP, forgot password)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Product Manager"
    SMTP_USE_TLS: bool = True

    OTP_EXPIRE_MINUTES: int = 10
    INVITATION_EXPIRE_HOURS: int = 72

    # Comma-separated emails that are auto-promoted to SUPER_ADMIN on register/login.
    # Set this via env var, e.g. SUPER_ADMIN_EMAILS=owner@company.com
    SUPER_ADMIN_EMAILS: str = ""

    @property
    def super_admin_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.SUPER_ADMIN_EMAILS.split(",") if e.strip()}

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    class Config:
        env_file = ".env"


settings = Settings()
