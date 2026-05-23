from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import FamilyMember, User
from app.schemas.schemas import (
    FamilyMemberCreate,
    FamilyMemberResponse,
    FamilyMemberUpdate,
)

router = APIRouter(prefix="/family", tags=["Family Circle"])


@router.get("/", response_model=List[FamilyMemberResponse])
def list_family_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List family members invited to the current user's care circle."""
    return db.query(FamilyMember).filter(
        FamilyMember.user_id == current_user.id
    ).order_by(FamilyMember.created_at.desc()).all()


@router.post("/", response_model=FamilyMemberResponse, status_code=201)
def invite_family_member(
    member: FamilyMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add or invite a family member to the user's care circle."""
    if not member.email and not member.phone:
        raise HTTPException(status_code=400, detail="Email or phone is required.")

    family_user = None
    if member.email:
        family_user = db.query(User).filter(User.email == member.email).first()

    contact_filter = (
        FamilyMember.email == member.email
        if member.email
        else FamilyMember.phone == member.phone
    )
    existing = db.query(FamilyMember).filter(
        FamilyMember.user_id == current_user.id,
        contact_filter,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This family member is already in your circle.")

    family_member = FamilyMember(
        **member.model_dump(),
        user_id=current_user.id,
        family_user_id=family_user.id if family_user else None,
        invite_accepted=family_user is not None,
        invite_token=None if family_user else uuid4().hex,
    )
    db.add(family_member)
    db.commit()
    db.refresh(family_member)
    return family_member


@router.put("/{member_id}", response_model=FamilyMemberResponse)
def update_family_member(
    member_id: int,
    updates: FamilyMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    family_member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.user_id == current_user.id,
    ).first()
    if not family_member:
        raise HTTPException(status_code=404, detail="Family member not found.")

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(family_member, field, value)
    db.commit()
    db.refresh(family_member)
    return family_member


@router.delete("/{member_id}", status_code=204)
def delete_family_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    family_member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.user_id == current_user.id,
    ).first()
    if not family_member:
        raise HTTPException(status_code=404, detail="Family member not found.")
    db.delete(family_member)
    db.commit()
