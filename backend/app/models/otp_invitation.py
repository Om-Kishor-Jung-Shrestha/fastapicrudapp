import enum
from datetime import datetime

from sqlalchemy import String, DateTime, Integer, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REVOKED = "revoked"
    EXPIRED = "expired"


class AdminInvitation(Base):
    """An invitation sent by a super admin, granting ADMIN role once accepted.

    The invitee must verify the OTP sent to the *exact* invited email address
    before the account is created -- this prevents anyone else from redeeming
    a leaked invitation link with a different email.
    """

    __tablename__ = "admin_invitations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    otp_code: Mapped[str] = mapped_column(String(6), nullable=False)

    invited_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus), default=InvitationStatus.PENDING, nullable=False
    )
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
