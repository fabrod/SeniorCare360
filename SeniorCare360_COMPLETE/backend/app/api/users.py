from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.schemas import UserResponse, UserProfileUpdate

router = APIRouter(prefix="/users", tags=["User Profile"])


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current user's full profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    updates: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update profile info including home delivery address."""
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me")
def deactivate_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivate (soft-delete) account."""
    current_user.is_active = False
    db.commit()
    return {"message": "Account deactivated successfully."}
