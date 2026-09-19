from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RegisterDTO(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=150)


class LoginDTO(BaseModel):
    email: EmailStr
    password: str


class UserResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    role: str
    auth_provider: str
    google_linked: bool = False
    google_email: Optional[str] = None
    is_verified: bool
    created_at: datetime


class TokenResponseDTO(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponseDTO


class ForgotPasswordDTO(BaseModel):
    email: EmailStr


class VerifyOtpDTO(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class ResetPasswordDTO(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)


class GoogleLinkCallbackDTO(BaseModel):
    code: str


class UpdateProfileDTO(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=150)
    avatar_url: Optional[str] = None


class ChangePasswordDTO(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class MessageDTO(BaseModel):
    message: str
