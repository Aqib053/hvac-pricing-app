from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class Charge(Base):
    """
    Stores the charge configuration from rows 1-3 of the Excel sheet.
    Four categories: SKD_FOB, SKD_CIF, CBU_FOB, CBU_CIF.
    These affect the landed cost multiplier used in price calculations.
    """
    __tablename__ = "charges"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), unique=True, nullable=False, index=True)
    label = Column(String(255), nullable=True)                     # Human-readable name
    customs_pct = Column(Float, nullable=False, default=0.0)       # Customs %
    freight_pct = Column(Float, nullable=False, default=0.0)       # Freight %
    handling_pct = Column(Float, nullable=False, default=1.0)      # Other Handling Cost %
    multiplier = Column(Float, nullable=False, default=1.0)        # Pre-calculated: 1 + customs/100 + freight/100 + handling/100
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
