from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_super_admin
from app.models.user import User
from app.services.invitation_service import InvitationService
from app.dtos.invitation_dto import InviteAdminDTO, InvitationResponseDTO, AcceptInvitationDTO
from app.dtos.auth_dto import TokenResponseDTO

router = APIRouter(prefix="/admin/invitations", tags=["Admin Invitations"])


@router.get("", response_model=List[InvitationResponseDTO])
def list_invitations(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_super_admin)
):
    return InvitationService(db).list_invitations()


@router.post("", response_model=InvitationResponseDTO, status_code=status.HTTP_201_CREATED)
def invite_admin(
    dto: InviteAdminDTO,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin),
):
    return InvitationService(db).invite_admin(dto, current_user)


@router.delete("/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin),
):
    InvitationService(db).revoke_invitation(invitation_id)


@router.post("/accept", response_model=TokenResponseDTO)
def accept_invitation(dto: AcceptInvitationDTO, db: Session = Depends(get_db)):
    # Public endpoint -- the invitee is not logged in yet. Authorization is
    # instead proven by knowing both the unguessable token AND the OTP that
    # was emailed to the invited address.
    return InvitationService(db).accept_invitation(dto)
