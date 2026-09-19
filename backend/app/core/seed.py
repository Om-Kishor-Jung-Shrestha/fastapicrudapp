import logging

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, UserRole, AuthProvider

logger = logging.getLogger("seed")

# Shared demo password for every seeded account below.
DEFAULT_PASSWORD = "Password123!"

DEFAULT_USERS = [
    {
        "email": "omshrestha40@gmail.com",
        "full_name": "Om Shrestha",
        "role": UserRole.SUPER_ADMIN,
    },
    {
        "email": "luciferdrose124@gmail.com",
        "full_name": "Lucifer Drose",
        "role": UserRole.ADMIN,
    },
    {
        "email": "omkishor.28471@student.trinity.edu.np",
        "full_name": "Om Kishor",
        "role": UserRole.USER,
    },
]


def seed_default_users(db: Session) -> None:
    """Idempotently creates the demo accounts if they don't already exist.

    Safe to run on every startup -- existing accounts (and any password
    changes the person has since made) are never touched or overwritten.
    """
    created_any = False
    for entry in DEFAULT_USERS:
        email = entry["email"].lower()
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            continue

        user = User(
            email=email,
            hashed_password=hash_password(DEFAULT_PASSWORD),
            full_name=entry["full_name"],
            role=entry["role"],
            auth_provider=AuthProvider.LOCAL,
            is_verified=True,
        )
        db.add(user)
        created_any = True
        logger.info("Seeded default user: %s as %s", email, entry["role"].value)

    if created_any:
        db.commit()
