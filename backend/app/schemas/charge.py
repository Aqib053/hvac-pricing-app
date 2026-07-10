from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class ChargeBase(BaseModel):
    customs_pct: float
    freight_pct: float
    handling_pct: float
    notes: Optional[str] = None


class ChargeUpdate(ChargeBase):
    pass


class ChargeOut(BaseModel):
    id: int
    category: str
    label: Optional[str]
    customs_pct: float
    freight_pct: float
    handling_pct: float
    multiplier: float
    notes: Optional[str]
    updated_at: datetime

    model_config = {"from_attributes": True}
