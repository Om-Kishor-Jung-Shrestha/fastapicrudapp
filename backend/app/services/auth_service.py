import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.core.email import email_service
from app.core.google_oauth import google_oauth_client
from app.core.redis_client import cache_service
from app.models.user import User, AuthProvider, UserRole
from app.models.otp import PasswordResetOTP
from app.repositories.user_repository import UserRepository
from app.dtos.auth_dto import (
    RegisterDTO,
    LoginDTO,
    UserResponseDTO,
    TokenResponseDTO,
    UpdateProfileDTO,
    ChangePasswordDTO,
)


def _to_user_dto(user: User) -> UserResponseDTO:
    return UserResponseDTO(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        role=user.role.value,
        auth_provider=user.auth_provider.value,
        google_linked=user.google_linked,
        google_email=user.google_email,
        is_verified=user.is_verified,
        created_at=user.created_at,
    )


def _maybe_promote_super_admin(db: Session, user: User) -> User:
    """Auto-promotes configured bootstrap emails to SUPER_ADMIN on register/login."""
    if user.email.lower() in settings.super_admin_email_set and user.role != UserRole.SUPER_ADMIN:
        user.role = UserRole.SUPER_ADMIN
        db.commit()
        db.refresh(user)
    return user


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = UserRepository(db)

    # ---------- Local email/password auth ----------

    def register(self, dto: RegisterDTO) -> TokenResponseDTO:
        if self.repository.get_by_email(dto.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        user = self.repository.create_local_user(
            email=dto.email, hashed_password=hash_password(dto.password), full_name=dto.full_name
        )
        user = _maybe_promote_super_admin(self.db, user)
        try:
            email_service.send_welcome_email(user.email, user.full_name)
        except Exception:
            pass  # never block registration on email delivery failure

        token = create_access_token(subject=str(user.id))
        return TokenResponseDTO(access_token=token, user=_to_user_dto(user))

    def login(self, dto: LoginDTO) -> TokenResponseDTO:
        user = self.repository.get_by_email(dto.email)
        if not user or not user.hashed_password or not verify_password(dto.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

        user = _maybe_promote_super_admin(self.db, user)
        token = create_access_token(subject=str(user.id))
        return TokenResponseDTO(access_token=token, user=_to_user_dto(user))

    def get_me(self, user: User) -> UserResponseDTO:
        return _to_user_dto(user)

    def update_profile(self, user: User, dto: UpdateProfileDTO) -> UserResponseDTO:
        updated = self.repository.update_profile(user, dto.full_name, dto.avatar_url)
        return _to_user_dto(updated)

    def change_password(self, user: User, dto: ChangePasswordDTO) -> None:
        if not user.hashed_password or not verify_password(dto.current_password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        self.repository.update_password(user, hash_password(dto.new_password))

    # ---------- Google OAuth (sign-in AND account linking) ----------

    def build_google_login_url(self) -> str:
        state = create_access_token(subject="google-oauth", extra_claims={"purpose": "login"})
        return google_oauth_client.build_authorize_url(state)

    def build_google_link_url(self, current_user: User) -> str:
        state = create_access_token(
            subject="google-oauth", extra_claims={"purpose": "link", "user_id": current_user.id}
        )
        return google_oauth_client.build_authorize_url(state)

    def handle_google_callback(self, code: str, state: str) -> tuple[TokenResponseDTO, str]:
        """Returns (token response, purpose) after completing the OAuth code exchange."""
        payload = decode_access_token(state)
        if not payload:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OAuth state")

        purpose = payload.get("purpose", "login")

        access_token = google_oauth_client.exchange_code_for_token(code)
        profile = google_oauth_client.fetch_userinfo(access_token)

        google_id = profile.get("sub")
        google_email = (profile.get("email") or "").lower()
        full_name = profile.get("name") or google_email.split("@")[0]
        avatar_url = profile.get("picture")

        if not google_id or not google_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google did not return an email")

        if purpose == "link":
            user = self._link_google_to_user(payload.get("user_id"), google_id, google_email, avatar_url)
        else:
            user = self._login_or_create_via_google(google_id, google_email, full_name, avatar_url)

        token = create_access_token(subject=str(user.id))
        return TokenResponseDTO(access_token=token, user=_to_user_dto(user)), purpose

    def _login_or_create_via_google(
        self, google_id: str, google_email: str, full_name: str, avatar_url: str | None
    ) -> User:
        existing_by_google = self.repository.get_by_google_id(google_id)
        if existing_by_google:
            return _maybe_promote_super_admin(self.db, existing_by_google)

        existing_by_email = self.repository.get_by_email(google_email)
        if existing_by_email:
            # A local account with this exact email already exists -> auto-link it,
            # since the Google email match IS the verification of ownership.
            linked = self.repository.link_google(existing_by_email, google_id, google_email, avatar_url)
            return _maybe_promote_super_admin(self.db, linked)

        created = self.repository.create_google_user(google_email, full_name, google_id, avatar_url)
        return _maybe_promote_super_admin(self.db, created)

    def _link_google_to_user(
        self, user_id: int | None, google_id: str, google_email: str, avatar_url: str | None
    ) -> User:
        if not user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing user context for linking")

        user = self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # CRITICAL: only allow linking a Google account whose email matches
        # this user's own account email -- never let it attach a different identity.
        if google_email != user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"That Google account ({google_email}) does not match your account "
                    f"email ({user.email}). Please sign in to Google with {user.email}."
                ),
            )

        other_owner = self.repository.get_by_google_id(google_id)
        if other_owner and other_owner.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This Google account is already linked to a different user",
            )

        return self.repository.link_google(user, google_id, google_email, avatar_url)

    def unlink_google(self, user: User) -> UserResponseDTO:
        if user.auth_provider == AuthProvider.GOOGLE and not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Set a password before unlinking Google, otherwise you'll be locked out.",
            )
        updated = self.repository.unlink_google(user)
        return _to_user_dto(updated)

    # ---------- Forgot password via SMTP OTP ----------

    def send_password_reset_otp(self, email: str) -> None:
        user = self.repository.get_by_email(email)
        if not user:
            # Do not reveal whether the email exists
            return

        code = "".join(random.choices(string.digits, k=6))
        otp = PasswordResetOTP(
            user_id=user.id,
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        )
        self.db.add(otp)
        self.db.commit()

        rate_limit_key = f"otp:ratelimit:{user.id}"
        cache_service.set(rate_limit_key, True, ttl=60)

        try:
            email_service.send_otp_email(user.email, code, purpose="password reset")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to send verification email. Check SMTP configuration.",
            )

    def reset_password(self, email: str, code: str, new_password: str) -> None:
        user = self.repository.get_by_email(email)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code or email")

        otp = (
            self.db.query(PasswordResetOTP)
            .filter(PasswordResetOTP.user_id == user.id, PasswordResetOTP.used.is_(False))
            .order_by(PasswordResetOTP.created_at.desc())
            .first()
        )

        if not otp or otp.attempts >= 5:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code")

        if otp.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code has expired")

        if otp.code != code:
            otp.attempts += 1
            self.db.commit()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code")

        otp.used = True
        self.db.commit()

        self.repository.update_password(user, hash_password(new_password))
