from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.charge import Charge


class ChargeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[Charge]:
        return self.db.query(Charge).order_by(Charge.id).all()

    def get_by_category(self, category: str) -> Optional[Charge]:
        return self.db.query(Charge).filter(Charge.category == category).first()

    def update(self, charge: Charge, customs_pct: float, freight_pct: float, handling_pct: float, notes: Optional[str] = None) -> Charge:
        charge.customs_pct = customs_pct
        charge.freight_pct = freight_pct
        charge.handling_pct = handling_pct
        charge.multiplier = round(1 + customs_pct / 100 + freight_pct / 100 + handling_pct / 100, 6)
        if notes is not None:
            charge.notes = notes
        self.db.commit()
        self.db.refresh(charge)
        return charge

    def upsert(self, category: str, label: str, customs_pct: float, freight_pct: float, handling_pct: float) -> Charge:
        existing = self.get_by_category(category)
        multiplier = round(1 + customs_pct / 100 + freight_pct / 100 + handling_pct / 100, 6)
        if existing:
            existing.label = label
            existing.customs_pct = customs_pct
            existing.freight_pct = freight_pct
            existing.handling_pct = handling_pct
            existing.multiplier = multiplier
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            charge = Charge(
                category=category,
                label=label,
                customs_pct=customs_pct,
                freight_pct=freight_pct,
                handling_pct=handling_pct,
                multiplier=multiplier,
            )
            self.db.add(charge)
            self.db.commit()
            self.db.refresh(charge)
            return charge
