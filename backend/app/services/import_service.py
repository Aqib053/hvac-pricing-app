import json
import logging
from io import BytesIO
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import openpyxl
from sqlalchemy.orm import Session
from app.repositories.product import ProductRepository
from app.repositories.charge import ChargeRepository
from app.repositories.margin import MarginRepository
from app.models.margin import MarginSetting

logger = logging.getLogger(__name__)

# Column index mapping (0-based) from the Excel sheet
COL_SUPPLIER = 0
COL_BRAND = 1
COL_CAPACITY = 2
COL_UNIT_TYPE = 3
COL_INDOOR_EPN = 4
COL_INDOOR_MODEL = 5
COL_MODE = 6
COL_REFRIGERANT = 7
COL_PRODUCT_TYPE = 8
COL_COUNTRY = 9
COL_QTY_FORECAST = 10
COL_FOB_INDOOR = 11
COL_FOB_OUTDOOR = 12
COL_FOB_OUTDOOR_SAR = 13
COL_LANDED_MULTIPLIER = 14
COL_PACKING_COST = 15
COL_BOM_COST = 16
COL_MFG_COST = 17
COL_TRANSFER_COST = 18
COL_TRANSFER_COST_SET = 19
COL_LIST_PRICE_UNIT = 20
COL_LIST_PRICE = 21
COL_GP_AT_LIST = 22
COL_PRICE_15 = 23
COL_PRICE_20 = 24
COL_PRICE_23 = 25
COL_PRICE_27 = 26
COL_PRICE_30 = 27
COL_GP_AT_30 = 28


def _safe_float(val) -> Optional[float]:
    if val is None:
        return None
    try:
        f = float(val)
        return round(f, 6) if f else None
    except (ValueError, TypeError):
        return None


def _safe_int(val) -> Optional[int]:
    if val is None:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def _safe_str(val) -> Optional[str]:
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


class ExcelImportService:
    def __init__(self, db: Session):
        self.db = db
        self.product_repo = ProductRepository(db)
        self.charge_repo = ChargeRepository(db)
        self.margin_repo = MarginRepository(db)

    def import_from_bytes(self, file_bytes: bytes) -> Dict[str, Any]:
        """Import Excel data from bytes (uploaded file)."""
        try:
            wb = openpyxl.load_workbook(BytesIO(file_bytes), data_only=True)
        except Exception as e:
            raise ValueError(f"Failed to read Excel file: {str(e)}")

        results = {"products_imported": 0, "products_updated": 0, "charges_imported": 0, "errors": [], "warnings": []}

        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            rows = list(ws.iter_rows(values_only=True))
            if len(rows) < 5:
                results["warnings"].append(f"Sheet '{sheet_name}' has fewer than 5 rows, skipping.")
                continue

            sheet_results = self._process_sheet(rows, sheet_name)
            results["products_imported"] += sheet_results["inserted"]
            results["products_updated"] += sheet_results["updated"]
            results["charges_imported"] += sheet_results["charges"]
            results["errors"].extend(sheet_results["errors"])

        return results

    def import_from_path(self, file_path: str) -> Dict[str, Any]:
        """Import Excel data from a file path."""
        with open(file_path, "rb") as f:
            return self.import_from_bytes(f.read())

    def _process_sheet(self, rows: list, sheet_name: str) -> Dict[str, Any]:
        results = {"inserted": 0, "updated": 0, "charges": 0, "errors": []}

        # Extract charges from rows 0-2 (Excel rows 1-3)
        try:
            charges_count = self._extract_and_save_charges(rows)
            results["charges"] = charges_count
        except Exception as e:
            results["errors"].append(f"Error extracting charges from '{sheet_name}': {str(e)}")

        # Seed default margins if not present
        self._seed_margins()

        # Data starts at row index 5 (Excel row 6, after header row 5)
        # Row index 4 is the header (Excel row 5)
        # We process pairs: main row (has Supplier) + outdoor row (no Supplier, just outdoor EPN/model)
        data_rows = rows[5:]  # Start from index 5 (6th row, 0-based)

        # We need to pair rows: main row followed by outdoor row
        i = 0
        while i < len(data_rows):
            row = data_rows[i]
            if not row or all(v is None for v in row):
                i += 1
                continue

            supplier = _safe_str(row[COL_SUPPLIER] if len(row) > COL_SUPPLIER else None)
            indoor_epn = _safe_str(row[COL_INDOOR_EPN] if len(row) > COL_INDOOR_EPN else None)

            if not supplier and not indoor_epn:
                i += 1
                continue

            # This is a main product row
            product_data = self._extract_product_row(row)

            # Look ahead for the outdoor row
            if i + 1 < len(data_rows):
                next_row = data_rows[i + 1]
                next_supplier = _safe_str(next_row[COL_SUPPLIER] if len(next_row) > COL_SUPPLIER else None)
                next_indoor_epn = _safe_str(next_row[COL_INDOOR_EPN] if len(next_row) > COL_INDOOR_EPN else None)

                # If next row has no supplier but has an EPN, it's the outdoor unit row
                if not next_supplier and next_indoor_epn:
                    product_data["outdoor_epn"] = next_indoor_epn
                    product_data["outdoor_model"] = _safe_str(next_row[COL_INDOOR_MODEL] if len(next_row) > COL_INDOOR_MODEL else None)
                    i += 2
                else:
                    i += 1
            else:
                i += 1

            if not product_data.get("indoor_epn"):
                results["errors"].append(f"Row skipped: no indoor EPN found")
                continue

            try:
                existing = self.product_repo.get_by_indoor_epn(product_data["indoor_epn"])
                if existing:
                    self.product_repo.upsert_by_indoor_epn(product_data)
                    results["updated"] += 1
                else:
                    self.product_repo.upsert_by_indoor_epn(product_data)
                    results["inserted"] += 1
            except Exception as e:
                results["errors"].append(f"Error saving product {product_data.get('indoor_epn')}: {str(e)}")
                logger.error(f"Error saving product: {e}", exc_info=True)

        return results

    def _extract_product_row(self, row: tuple) -> dict:
        def get(idx):
            return row[idx] if len(row) > idx else None

        extra_cols = {}
        for idx in range(29, len(row)):
            val = get(idx)
            if val is not None:
                extra_cols[f"col_{idx}"] = _safe_float(val)

        return {
            "supplier": _safe_str(get(COL_SUPPLIER)),
            "brand": _safe_str(get(COL_BRAND)),
            "capacity": _safe_int(get(COL_CAPACITY)),
            "unit_type": _safe_str(get(COL_UNIT_TYPE)),
            "indoor_epn": _safe_str(get(COL_INDOOR_EPN)),
            "indoor_model": _safe_str(get(COL_INDOOR_MODEL)),
            "outdoor_epn": None,
            "outdoor_model": None,
            "mode": _safe_str(get(COL_MODE)),
            "refrigerant": _safe_str(get(COL_REFRIGERANT)),
            "product_type": _safe_str(get(COL_PRODUCT_TYPE)),
            "country": _safe_str(get(COL_COUNTRY)),
            "qty_forecast": _safe_int(get(COL_QTY_FORECAST)),
            "fob_price_indoor": _safe_float(get(COL_FOB_INDOOR)),
            "fob_price_outdoor": _safe_float(get(COL_FOB_OUTDOOR)),
            "fob_outdoor_sar": _safe_float(get(COL_FOB_OUTDOOR_SAR)),
            "landed_multiplier": _safe_float(get(COL_LANDED_MULTIPLIER)),
            "packing_cost": _safe_float(get(COL_PACKING_COST)),
            "bom_cost": _safe_float(get(COL_BOM_COST)),
            "manufacturing_cost": _safe_float(get(COL_MFG_COST)),
            "transfer_cost": _safe_float(get(COL_TRANSFER_COST)),
            "transfer_cost_per_set": _safe_float(get(COL_TRANSFER_COST_SET)),
            "list_price_per_unit": _safe_float(get(COL_LIST_PRICE_UNIT)),
            "list_price": _safe_float(get(COL_LIST_PRICE)),
            "gp_at_list": _safe_float(get(COL_GP_AT_LIST)),
            "price_15": _safe_float(get(COL_PRICE_15)),
            "price_20": _safe_float(get(COL_PRICE_20)),
            "price_23": _safe_float(get(COL_PRICE_23)),
            "price_27": _safe_float(get(COL_PRICE_27)),
            "price_30": _safe_float(get(COL_PRICE_30)),
            "gp_at_30": _safe_float(get(COL_GP_AT_30)),
            "extra_data": json.dumps(extra_cols) if extra_cols else None,
        }

    def _extract_and_save_charges(self, rows: list) -> int:
        """
        Parse rows 0-2 (Excel rows 1-3) for charge configuration.
        Structure: 4 charge categories, each spanning 5 columns.
        Col offsets: 0=category_name, 1=charge_type_name, 2=charge_value, 3=multiplier
        Categories at column offsets: 0, 5, 10, 15
        """
        row1 = rows[0] if len(rows) > 0 else []
        row2 = rows[1] if len(rows) > 1 else []
        row3 = rows[2] if len(rows) > 2 else []

        categories = [
            {"category": "SKD_FOB", "col_offset": 0, "label": "HVAC-SKD (FOB)"},
            {"category": "SKD_CIF", "col_offset": 5, "label": "HVAC-SKD (CIF)"},
            {"category": "CBU_FOB", "col_offset": 10, "label": "HVAC-CBU (FOB)"},
            {"category": "CBU_CIF", "col_offset": 15, "label": "HVAC-CBU (CIF)"},
        ]

        def safe_get(row, idx):
            try:
                return row[idx] if idx < len(row) else None
            except IndexError:
                return None

        count = 0
        for cat in categories:
            offset = cat["col_offset"]
            # Row 1: col+2 = customs%, col+3 = multiplier (not used, we recalculate)
            # Row 2: col+2 = freight%
            # Row 3: col+2 = handling%
            customs_pct = _safe_float(safe_get(row1, offset + 2)) or 0.0
            freight_pct = _safe_float(safe_get(row2, offset + 2)) or 0.0
            handling_pct = _safe_float(safe_get(row3, offset + 2)) or 0.0

            self.charge_repo.upsert(
                category=cat["category"],
                label=cat["label"],
                customs_pct=customs_pct,
                freight_pct=freight_pct,
                handling_pct=handling_pct,
            )
            count += 1

        return count

    def _seed_margins(self) -> None:
        """Seed default margin percentages from the Excel column headers."""
        default_margins = [
            (0.15, "15%", 0),
            (0.20, "20%", 1),
            (0.23, "23%", 2),
            (0.27, "27%", 3),
            (0.30, "30%", 4),
        ]
        for pct, label, order in default_margins:
            existing = self.db.query(MarginSetting).filter_by(percentage=pct).first()
            if not existing:
                self.margin_repo.create(percentage=pct, label=label, sort_order=order)
