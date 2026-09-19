from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.dtos.auth_dto import (
    RegisterDTO,
    LoginDTO,
    TokenResponseDTO,
    UserResponseDTO,
    ForgotPasswordDTO,
    ResetPasswordDTO,
    UpdateProfileDTO,
    ChangePasswordDTO,
    MessageDTO,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponseDTO, status_code=201)
def register(dto: RegisterDTO, db: Session = Depends(get_db)):
    return AuthService(db).register(dto)


@router.post("/login", response_model=TokenResponseDTO)
def login(dto: LoginDTO, db: Session = Depends(get_db)):
    return AuthService(db).login(dto)


@router.get("/me", response_model=UserResponseDTO)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return AuthService(db).get_me(current_user)


@router.put("/me", response_model=UserResponseDTO)
def update_profile(
    dto: UpdateProfileDTO,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AuthService(db).update_profile(current_user, dto)


@router.post("/change-password", response_model=MessageDTO)
def change_password(
    dto: ChangePasswordDTO,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    AuthService(db).change_password(current_user, dto)
    return MessageDTO(message="Password changed successfully.")


@router.post("/forgot-password", response_model=MessageDTO)
def forgot_password(dto: ForgotPasswordDTO, db: Session = Depends(get_db)):
    AuthService(db).send_password_reset_otp(dto.email)
    return MessageDTO(message="If that email exists, a verification code has been sent.")


@router.post("/reset-password", response_model=MessageDTO)
def reset_password(dto: ResetPasswordDTO, db: Session = Depends(get_db)):
    AuthService(db).reset_password(dto.email, dto.code, dto.new_password)
    return MessageDTO(message="Password has been reset successfully.")


# ---------- Google OAuth: sign-in flow ----------


@router.get("/google/login")
def google_login(db: Session = Depends(get_db)):
    url = AuthService(db).build_google_login_url()
    return RedirectResponse(url)


@router.get("/google/callback")
def google_callback(code: str = Query(...), state: str = Query(...), db: Session = Depends(get_db)):
    token_response, purpose = AuthService(db).handle_google_callback(code, state)
    redirect_path = "/app/profile" if purpose == "link" else "/auth/callback"
    query_extra = "&linked=google" if purpose == "link" else ""
    redirect_url = f"{settings.FRONTEND_URL}{redirect_path}?token={token_response.access_token}{query_extra}"
    return RedirectResponse(redirect_url)


# ---------- Google OAuth: account-linking flow (must match logged-in user's email) ----------


@router.get("/google/link")
def google_link(token: str = Query(...), db: Session = Depends(get_db)):
    # This endpoint is hit via a full-page browser redirect (window.location),
    # which cannot carry an Authorization header, so the JWT is passed as a
    # short-lived query param here instead.
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    current_user = UserRepository(db).get_by_id(int(payload["sub"]))
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    url = AuthService(db).build_google_link_url(current_user)
    return RedirectResponse(url)


@router.post("/google/unlink", response_model=UserResponseDTO)
def google_unlink(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return AuthService(db).unlink_google(current_user)
