from sqlalchemy import Column, Integer, Float, Boolean, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class MarginSetting(Base):
    """
    Stores configurable margin/discount percentages.
    Default: 15%, 20%, 23%, 27%, 30% - from the Excel columns.
    Admin can add / remove / edit percentages.
    """
    __tablename__ = "margin_settings"

    id = Column(Integer, primary_key=True, index=True)
    percentage = Column(Float, nullable=False)                     # e.g. 0.15 for 15%
    label = Column(String(50), nullable=True)                      # e.g. "15%"
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
