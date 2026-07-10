from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProductBase(BaseModel):
    supplier: Optional[str] = None
    brand: Optional[str] = None
    capacity: Optional[int] = None
    unit_type: Optional[str] = None
    mode: Optional[str] = None
    refrigerant: Optional[str] = None
    product_type: Optional[str] = None
    country: Optional[str] = None
    indoor_epn: Optional[str] = None
    indoor_model: Optional[str] = None
    outdoor_epn: Optional[str] = None
    outdoor_model: Optional[str] = None
    qty_forecast: Optional[int] = None
    fob_price_indoor: Optional[float] = None
    fob_price_outdoor: Optional[float] = None
    fob_outdoor_sar: Optional[float] = None
    landed_multiplier: Optional[float] = None
    packing_cost: Optional[float] = None
    bom_cost: Optional[float] = None
    manufacturing_cost: Optional[float] = None
    transfer_cost: Optional[float] = None
    transfer_cost_per_set: Optional[float] = None
    list_price_per_unit: Optional[float] = None
    list_price: Optional[float] = None
    gp_at_list: Optional[float] = None
    price_15: Optional[float] = None
    price_20: Optional[float] = None
    price_23: Optional[float] = None
    price_27: Optional[float] = None
    price_30: Optional[float] = None
    gp_at_30: Optional[float] = None
    extra_data: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    id: int
    supplier: Optional[str]
    brand: Optional[str]
    capacity: Optional[int]
    mode: Optional[str]
    product_type: Optional[str]
    indoor_epn: Optional[str]
    indoor_model: Optional[str]
    outdoor_epn: Optional[str]
    outdoor_model: Optional[str]
    list_price: Optional[float]
    transfer_cost_per_set: Optional[float]
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductSearchParams(BaseModel):
    q: Optional[str] = None
    supplier: Optional[str] = None
    brand: Optional[str] = None
    mode: Optional[str] = None
    product_type: Optional[str] = None
    capacity: Optional[int] = None
    page: int = 1
    page_size: int = 20
