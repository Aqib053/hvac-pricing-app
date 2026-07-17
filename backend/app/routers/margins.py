from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.repositories.margin import MarginRepository
from app.schemas.margin import MarginCreate, MarginUpdate, MarginOut
from app.auth.jwt import get_current_user, get_current_admin

router = APIRouter(prefix="/margins", tags=["Margins"])


@router.get("", response_model=List[MarginOut])
def get_margins(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    repo = MarginRepository(db)
    return repo.get_all()


@router.post("", response_model=MarginOut, status_code=status.HTTP_201_CREATED)
def create_margin(data: MarginCreate, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    repo = MarginRepository(db)
    return repo.create(
        percentage=data.percentage,
        label=data.label,
        is_active=data.is_active,
        sort_order=data.sort_order,
    )


@router.put("/{margin_id}", response_model=MarginOut)
def update_margin(margin_id: int, data: MarginUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    repo = MarginRepository(db)
    margin = repo.get_by_id(margin_id)
    if not margin:
        raise HTTPException(status_code=404, detail="Margin not found")
    return repo.update(
        margin,
        percentage=data.percentage,
        label=data.label,
        is_active=data.is_active,
        sort_order=data.sort_order,
    )


@router.delete("/{margin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_margin(margin_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    repo = MarginRepository(db)
    margin = repo.get_by_id(margin_id)
    if not margin:
        raise HTTPException(status_code=404, detail="Margin not found")
    repo.delete(margin)
