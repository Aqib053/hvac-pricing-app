from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.repositories.product import ProductRepository
from app.repositories.margin import MarginRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductListOut
from app.services.pricing import build_pricing_table, build_cost_summary

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("")
def list_products(
    q: Optional[str] = Query(None, description="Search across model, EPN, supplier, brand"),
    supplier: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    mode: Optional[str] = Query(None),
    product_type: Optional[str] = Query(None),
    capacity: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    repo = ProductRepository(db)
    products, total = repo.get_all(
        q=q, supplier=supplier, brand=brand, mode=mode,
        product_type=product_type, capacity=capacity,
        page=page, page_size=page_size,
    )
    return {
        "items": [ProductListOut.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/filters")
def get_filter_options(db: Session = Depends(get_db)):
    """Get distinct values for filter dropdowns."""
    repo = ProductRepository(db)
    return repo.get_distinct_values()


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    repo = ProductRepository(db)
    margin_repo = MarginRepository(db)
    product = repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    margins = margin_repo.get_all(active_only=True)
    pricing_table = build_pricing_table(product, margins)
    cost_summary = build_cost_summary(product)

    return {
        "product": ProductOut.model_validate(product),
        "cost_summary": cost_summary,
        "pricing_table": pricing_table,
    }


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    repo = ProductRepository(db)
    if data.indoor_epn:
        existing = repo.get_by_indoor_epn(data.indoor_epn)
        if existing:
            raise HTTPException(status_code=409, detail=f"Product with indoor EPN '{data.indoor_epn}' already exists")
    return repo.create(data)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    repo = ProductRepository(db)
    product = repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return repo.update(product, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    repo = ProductRepository(db)
    product = repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    repo.delete(product)
