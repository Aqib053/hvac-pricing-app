from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.margin import MarginSetting


class MarginRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, active_only: bool = False) -> List[MarginSetting]:
        query = self.db.query(MarginSetting)
        if active_only:
            query = query.filter(MarginSetting.is_active == True)
        return query.order_by(MarginSetting.sort_order, MarginSetting.percentage).all()

    def get_by_id(self, margin_id: int) -> Optional[MarginSetting]:
        return self.db.query(MarginSetting).filter(MarginSetting.id == margin_id).first()

    def create(self, percentage: float, label: Optional[str] = None, is_active: bool = True, sort_order: int = 0) -> MarginSetting:
        if not label:
            label = f"{round(percentage * 100)}%"
        margin = MarginSetting(
            percentage=percentage,
            label=label,
            is_active=is_active,
            sort_order=sort_order,
        )
        self.db.add(margin)
        self.db.commit()
        self.db.refresh(margin)
        return margin

    def update(self, margin: MarginSetting, **kwargs) -> MarginSetting:
        for key, value in kwargs.items():
            if value is not None:
                setattr(margin, key, value)
        self.db.commit()
        self.db.refresh(margin)
        return margin

    def delete(self, margin: MarginSetting) -> None:
        self.db.delete(margin)
        self.db.commit()

    def upsert_by_percentage(self, percentage: float, label: str) -> MarginSetting:
        existing = self.db.query(MarginSetting).filter(MarginSetting.percentage == percentage).first()
        if existing:
            existing.label = label
            self.db.commit()
            self.db.refresh(existing)
            return existing
        return self.create(percentage, label)
