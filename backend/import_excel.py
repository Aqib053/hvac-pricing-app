#!/usr/bin/env python3
"""
Standalone Excel import script.
Usage: python import_excel.py path/to/pricing.xlsx

This script reads the pricing Excel file, extracts all product data and charge
configurations, then upserts everything into the PostgreSQL database.
The import is idempotent - running it multiple times is safe.
"""

import sys
import os
import logging

# Add the parent directory to sys.path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    if len(sys.argv) < 2:
        print("Usage: python import_excel.py <path_to_excel_file>")
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        sys.exit(1)

    if not file_path.lower().endswith((".xlsx", ".xls")):
        logger.error("File must be an Excel file (.xlsx or .xls)")
        sys.exit(1)

    logger.info(f"Starting import from: {file_path}")

    from app.database import SessionLocal, Base, engine
    from app.models import User, Product, Charge, MarginSetting
    from app.repositories.user import UserRepository
    from app.services.import_service import ExcelImportService
    from app.config import settings

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")

    db = SessionLocal()
    try:
        # Ensure admin user exists
        user_repo = UserRepository(db)
        user_repo.ensure_admin_exists(
            email=settings.ADMIN_EMAIL,
            password=settings.ADMIN_PASSWORD,
        )
        logger.info(f"Admin user ensured: {settings.ADMIN_EMAIL}")

        # Run import
        service = ExcelImportService(db)
        result = service.import_from_path(file_path)

        logger.info("=" * 60)
        logger.info("IMPORT COMPLETE")
        logger.info(f"  Products inserted: {result['products_imported']}")
        logger.info(f"  Products updated:  {result['products_updated']}")
        logger.info(f"  Charges imported:  {result['charges_imported']}")

        if result["warnings"]:
            logger.warning("Warnings:")
            for w in result["warnings"]:
                logger.warning(f"  - {w}")

        if result["errors"]:
            logger.error("Errors:")
            for e in result["errors"]:
                logger.error(f"  - {e}")
        else:
            logger.info("No errors encountered")

        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Fatal error during import: {e}", exc_info=True)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
