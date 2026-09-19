from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class InviteAdminDTO(BaseModel):
    email: EmailStr


class InvitationResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    status: str
    expires_at: datetime
    created_at: datetime


class AcceptInvitationDTO(BaseModel):
    token: str
    otp_code: str = Field(..., min_length=6, max_length=6)
    full_name: str = Field(..., min_length=1, max_length=150)
    password: str = Field(..., min_length=8, max_length=128)


class InvitationPreviewDTO(BaseModel):
    email: str
    status: str
    valid: bool
