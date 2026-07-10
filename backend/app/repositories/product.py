from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, product_id: int) -> Optional[Product]:
        return self.db.query(Product).filter(Product.id == product_id).first()

    def get_by_indoor_epn(self, indoor_epn: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.indoor_epn == indoor_epn).first()

    def get_all(
        self,
        q: Optional[str] = None,
        supplier: Optional[str] = None,
        brand: Optional[str] = None,
        mode: Optional[str] = None,
        product_type: Optional[str] = None,
        capacity: Optional[int] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Product], int]:
        query = self.db.query(Product)

        if q:
            search = f"%{q}%"
            query = query.filter(
                or_(
                    Product.indoor_model.ilike(search),
                    Product.outdoor_model.ilike(search),
                    Product.indoor_epn.ilike(search),
                    Product.outdoor_epn.ilike(search),
                    Product.supplier.ilike(search),
                    Product.brand.ilike(search),
                )
            )
        if supplier:
            query = query.filter(Product.supplier.ilike(f"%{supplier}%"))
        if brand:
            query = query.filter(Product.brand.ilike(f"%{brand}%"))
        if mode:
            query = query.filter(Product.mode.ilike(f"%{mode}%"))
        if product_type:
            query = query.filter(Product.product_type.ilike(f"%{product_type}%"))
        if capacity:
            query = query.filter(Product.capacity == capacity)

        total = query.count()
        products = (
            query.order_by(Product.supplier, Product.brand, Product.capacity)
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return products, total

    def create(self, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product, data: ProductUpdate) -> Product:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(product, key, value)
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product: Product) -> None:
        self.db.delete(product)
        self.db.commit()

    def upsert_by_indoor_epn(self, data: dict) -> Product:
        indoor_epn = data.get("indoor_epn")
        existing = None
        if indoor_epn:
            existing = self.db.query(Product).filter(Product.indoor_epn == indoor_epn).first()

        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            product = Product(**data)
            self.db.add(product)
            self.db.commit()
            self.db.refresh(product)
            return product

    def get_stats(self) -> dict:
        total = self.db.query(func.count(Product.id)).scalar()
        brands = self.db.query(func.count(func.distinct(Product.brand))).scalar()
        suppliers = self.db.query(func.count(func.distinct(Product.supplier))).scalar()
        recent = (
            self.db.query(Product)
            .order_by(Product.updated_at.desc())
            .limit(5)
            .all()
        )
        return {
            "total_products": total,
            "total_brands": brands,
            "total_suppliers": suppliers,
            "recent_updates": recent,
        }

    def get_distinct_values(self) -> dict:
        suppliers = [r[0] for r in self.db.query(func.distinct(Product.supplier)).filter(Product.supplier.isnot(None)).all()]
        brands = [r[0] for r in self.db.query(func.distinct(Product.brand)).filter(Product.brand.isnot(None)).all()]
        modes = [r[0] for r in self.db.query(func.distinct(Product.mode)).filter(Product.mode.isnot(None)).all()]
        types = [r[0] for r in self.db.query(func.distinct(Product.product_type)).filter(Product.product_type.isnot(None)).all()]
        capacities = [r[0] for r in self.db.query(func.distinct(Product.capacity)).filter(Product.capacity.isnot(None)).order_by(Product.capacity).all()]
        return {
            "suppliers": sorted(suppliers),
            "brands": sorted(brands),
            "modes": sorted(modes),
            "product_types": sorted(types),
            "capacities": capacities,
        }
