from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories.product import ProductRepository
from app.schemas.product import ProductListOut

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(db: Session = Depends(get_db)):
    repo = ProductRepository(db)
    stats = repo.get_stats()
    return {
        "total_products": stats["total_products"],
        "total_brands": stats["total_brands"],
        "total_suppliers": stats["total_suppliers"],
        "recent_updates": [ProductListOut.model_validate(p) for p in stats["recent_updates"]],
    }
