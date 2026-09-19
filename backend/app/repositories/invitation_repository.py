from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.otp_invitation import AdminInvitation, InvitationStatus


class InvitationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[AdminInvitation]:
        return self.db.query(AdminInvitation).order_by(AdminInvitation.created_at.desc()).all()

    def get_by_id(self, invitation_id: int) -> Optional[AdminInvitation]:
        return self.db.query(AdminInvitation).filter(AdminInvitation.id == invitation_id).first()

    def get_by_token(self, token: str) -> Optional[AdminInvitation]:
        return self.db.query(AdminInvitation).filter(AdminInvitation.token == token).first()

    def get_pending_by_email(self, email: str) -> Optional[AdminInvitation]:
        return (
            self.db.query(AdminInvitation)
            .filter(
                AdminInvitation.email == email.lower(),
                AdminInvitation.status == InvitationStatus.PENDING,
            )
            .order_by(AdminInvitation.created_at.desc())
            .first()
        )

    def create(self, invitation: AdminInvitation) -> AdminInvitation:
        self.db.add(invitation)
        self.db.commit()
        self.db.refresh(invitation)
        return invitation

    def save(self, invitation: AdminInvitation) -> AdminInvitation:
        self.db.commit()
        self.db.refresh(invitation)
        return invitation
