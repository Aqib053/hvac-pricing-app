from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    """
    Represents a product set (indoor + outdoor unit pair).
    Maps directly to the pricing Excel sheet structure.
    Each row in the Excel that has a Supplier value is one product set.
    The outdoor unit model info is stored as outdoor_epn / outdoor_model.
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    # Product identification
    supplier = Column(String(255), nullable=True, index=True)
    brand = Column(String(255), nullable=True, index=True)
    capacity = Column(Integer, nullable=True, index=True)          # BTU in thousands (12, 18, 24, 30, 36)
    unit_type = Column(String(100), nullable=True)                 # e.g. MSPlit
    mode = Column(String(100), nullable=True, index=True)          # Cool only / Heat Cool
    refrigerant = Column(String(50), nullable=True)                # R32
    product_type = Column(String(100), nullable=True, index=True)  # Inverter
    country = Column(String(100), nullable=True)                   # Made in

    # Indoor unit
    indoor_epn = Column(String(255), nullable=True, unique=True, index=True)
    indoor_model = Column(String(255), nullable=True, index=True)

    # Outdoor unit
    outdoor_epn = Column(String(255), nullable=True, index=True)
    outdoor_model = Column(String(255), nullable=True, index=True)

    # Quantities
    qty_forecast = Column(Integer, nullable=True)                  # Qty 2026 Forecast

    # Pricing - FOB
    fob_price_indoor = Column(Float, nullable=True)                # FOB$ (CIF Haier only) - indoor unit
    fob_price_outdoor = Column(Float, nullable=True)               # FOB$ (CIF Haier) - outdoor unit component
    fob_outdoor_sar = Column(Float, nullable=True)                 # US$ to SAR (outdoor cost in SAR)

    # Cost structure
    landed_multiplier = Column(Float, nullable=True)               # Landed cost multiplier (e.g. 1.16)
    packing_cost = Column(Float, nullable=True)
    bom_cost = Column(Float, nullable=True)                        # BOM cost (SAR)
    manufacturing_cost = Column(Float, nullable=True)              # Mfg Cost (SAR)
    transfer_cost = Column(Float, nullable=True)                   # Indoor unit transfer cost (SAR)
    transfer_cost_per_set = Column(Float, nullable=True)           # Total set transfer cost (SAR) = indoor + outdoor

    # List pricing
    list_price_per_unit = Column(Float, nullable=True)             # List Price Indoor/Outdoor (per individual unit)
    list_price = Column(Float, nullable=True)                      # 0% Discount List Price (full set)
    gp_at_list = Column(Float, nullable=True)                      # GP% at 0% discount

    # Discount tier prices (selling price at each discount level)
    price_15 = Column(Float, nullable=True)                        # Price at 15% discount
    price_20 = Column(Float, nullable=True)                        # Price at 20% discount
    price_23 = Column(Float, nullable=True)                        # Price at 23% discount
    price_27 = Column(Float, nullable=True)                        # Price at 27% discount
    price_30 = Column(Float, nullable=True)                        # Price at 30% discount
    gp_at_30 = Column(Float, nullable=True)                        # GP% at 30% discount

    # Extra / additional calculated fields from Excel
    extra_data = Column(Text, nullable=True)                       # JSON for any extra columns

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
