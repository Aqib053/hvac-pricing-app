from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.repositories.charge import ChargeRepository
from app.schemas.charge import ChargeOut, ChargeUpdate
from app.auth.jwt import get_current_user, get_current_admin

router = APIRouter(prefix="/charges", tags=["Charges"])


@router.get("", response_model=List[ChargeOut])
def get_charges(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    repo = ChargeRepository(db)
    return repo.get_all()


@router.put("/{category}", response_model=ChargeOut)
def update_charge(category: str, data: ChargeUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    repo = ChargeRepository(db)
    charge = repo.get_by_category(category)
    if not charge:
        raise HTTPException(status_code=404, detail=f"Charge category '{category}' not found")
    return repo.update(
        charge,
        customs_pct=data.customs_pct,
        freight_pct=data.freight_pct,
        handling_pct=data.handling_pct,
        notes=data.notes,
    )
