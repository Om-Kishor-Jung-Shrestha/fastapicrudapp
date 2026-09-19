from fastapi import APIRouter, UploadFile, File, Depends

from app.services.upload_service import UploadService
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("")
def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    url = UploadService().save_image(file)
    return {"url": url}
