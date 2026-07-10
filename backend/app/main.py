import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, SessionLocal
from app.models import Product, Charge, MarginSetting
from app.database import Base
from app.routers import products, charges, margins, import_data, dashboard

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title="Pricing Management System",
    description="Production-ready HVAC pricing management API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"
app.include_router(products.router, prefix=API_PREFIX)
app.include_router(charges.router, prefix=API_PREFIX)
app.include_router(margins.router, prefix=API_PREFIX)
app.include_router(import_data.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}
