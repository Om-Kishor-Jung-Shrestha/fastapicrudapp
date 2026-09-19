import random
import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, create_access_token
from app.core.email import email_service
from app.models.user import User, UserRole, AuthProvider
from app.models.otp_invitation import AdminInvitation, InvitationStatus
from app.repositories.invitation_repository import InvitationRepository
from app.repositories.user_repository import UserRepository
from app.dtos.invitation_dto import InviteAdminDTO, AcceptInvitationDTO
from app.dtos.auth_dto import TokenResponseDTO
from app.services.auth_service import _to_user_dto


class InvitationService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = InvitationRepository(db)
        self.user_repository = UserRepository(db)

    def invite_admin(self, dto: InviteAdminDTO, invited_by: User) -> AdminInvitation:
        email = dto.email.lower()

        existing_user = self.user_repository.get_by_email(email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists"
            )

        existing_pending = self.repository.get_pending_by_email(email)
        if existing_pending:
            existing_pending.status = InvitationStatus.REVOKED
            self.repository.save(existing_pending)

        token = secrets.token_urlsafe(32)
        otp_code = "".join(random.choices(string.digits, k=6))

        invitation = AdminInvitation(
            email=email,
            token=token,
            otp_code=otp_code,
            invited_by_id=invited_by.id,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=settings.INVITATION_EXPIRE_HOURS),
        )
        invitation = self.repository.create(invitation)

        accept_url = f"{settings.FRONTEND_URL}/accept-invite?token={token}"
        try:
            email_service.send(
                to_email=email,
                subject="You've been invited as an Admin",
                html_body=f"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
                  <h2>You're invited to become an Admin</h2>
                  <p>{invited_by.full_name or invited_by.email} invited you to join
                     Product Manager as an <b>Admin</b>, with permission to manage
                     product categories.</p>
                  <p><a href="{accept_url}" style="color:#4f46e5">Click here to accept the invitation</a></p>
                  <p>You'll need this verification code to confirm it's really you:</p>
                  <div style="font-size:28px;font-weight:bold;letter-spacing:6px;
                              background:#f1f5f9;padding:14px;border-radius:8px;text-align:center">
                    {otp_code}
                  </div>
                  <p style="color:#64748b;font-size:13px;margin-top:24px">
                    This invitation expires in {settings.INVITATION_EXPIRE_HOURS} hours and can only
                    be redeemed using the email address {email}.
                  </p>
                </div>
                """,
                text_body=f"You're invited as Admin. Visit {accept_url} and use code {otp_code}.",
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to send invitation email. Check SMTP configuration.",
            )

        return invitation

    def list_invitations(self) -> list[AdminInvitation]:
        return self.repository.get_all()

    def revoke_invitation(self, invitation_id: int) -> None:
        invitation = self.repository.get_by_id(invitation_id)
        if not invitation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
        invitation.status = InvitationStatus.REVOKED
        self.repository.save(invitation)

    def accept_invitation(self, dto: AcceptInvitationDTO) -> TokenResponseDTO:
        invitation = self.repository.get_by_token(dto.token)
        if not invitation or invitation.status != InvitationStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or already-used invitation")

        if invitation.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            invitation.status = InvitationStatus.EXPIRED
            self.repository.save(invitation)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation has expired")

        if invitation.attempts >= 5:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Too many failed attempts")

        if invitation.otp_code != dto.otp_code:
            invitation.attempts += 1
            self.repository.save(invitation)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

        if self.user_repository.get_by_email(invitation.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Account already exists, please log in")

        # The account is created with EXACTLY the invited email address --
        # the OTP step already proved control of that specific inbox.
        user = User(
            email=invitation.email,
            hashed_password=hash_password(dto.password),
            full_name=dto.full_name,
            role=UserRole.ADMIN,
            auth_provider=AuthProvider.LOCAL,
            is_verified=True,
        )
        self.db.add(user)

        invitation.status = InvitationStatus.ACCEPTED
        self.db.commit()
        self.db.refresh(user)

        token = create_access_token(subject=str(user.id))
        return TokenResponseDTO(access_token=token, user=_to_user_dto(user))
