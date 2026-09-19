from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User, AuthProvider


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower()).first()

    def get_by_google_id(self, google_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.google_id == google_id).first()

    def create_local_user(self, email: str, hashed_password: str, full_name: str) -> User:
        user = User(
            email=email.lower(),
            hashed_password=hashed_password,
            full_name=full_name,
            auth_provider=AuthProvider.LOCAL,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_google_user(
        self, email: str, full_name: str, google_id: str, avatar_url: Optional[str]
    ) -> User:
        user = User(
            email=email.lower(),
            full_name=full_name,
            auth_provider=AuthProvider.GOOGLE,
            google_id=google_id,
            google_email=email.lower(),
            avatar_url=avatar_url,
            is_verified=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def link_google(self, user: User, google_id: str, google_email: str, avatar_url: Optional[str]) -> User:
        user.google_id = google_id
        user.google_email = google_email.lower()
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        self.db.commit()
        self.db.refresh(user)
        return user

    def unlink_google(self, user: User) -> User:
        user.google_id = None
        user.google_email = None
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_password(self, user: User, hashed_password: str) -> User:
        user.hashed_password = hashed_password
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_profile(self, user: User, full_name: str | None, avatar_url: str | None) -> User:
        if full_name is not None:
            user.full_name = full_name
        if avatar_url is not None:
            user.avatar_url = avatar_url
        self.db.commit()
        self.db.refresh(user)
        return user

    def mark_verified(self, user: User) -> User:
        user.is_verified = True
        self.db.commit()
        self.db.refresh(user)
        return user
