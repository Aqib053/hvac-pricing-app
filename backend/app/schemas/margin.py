from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MarginBase(BaseModel):
    percentage: float
    label: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class MarginCreate(MarginBase):
    pass


class MarginUpdate(BaseModel):
    percentage: Optional[float] = None
    label: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class MarginOut(BaseModel):
    id: int
    percentage: float
    label: Optional[str]
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
