from typing import List, Optional, Dict
from app.models.product import Product
from app.models.margin import MarginSetting


SAR_EXCHANGE_RATE = 3.75  # Default SAR/USD rate


def calculate_selling_price(list_price: Optional[float], discount_pct: float) -> Optional[float]:
    """Calculate the selling price after applying a discount percentage."""
    if list_price is None:
        return None
    return round(list_price * (1 - discount_pct), 2)


def calculate_gp_percentage(selling_price: Optional[float], cost: Optional[float]) -> Optional[float]:
    """Calculate gross profit percentage: (selling_price - cost) / selling_price."""
    if not selling_price or not cost or selling_price <= 0:
        return None
    return round((selling_price - cost) / selling_price, 4)


def calculate_profit(selling_price: Optional[float], cost: Optional[float]) -> Optional[float]:
    """Calculate profit (selling_price - cost)."""
    if selling_price is None or cost is None:
        return None
    return round(selling_price - cost, 2)


def calculate_landed_cost(fob_price: Optional[float], multiplier: Optional[float]) -> Optional[float]:
    """Calculate landed cost from FOB price and multiplier."""
    if fob_price is None or multiplier is None:
        return None
    return round(fob_price * multiplier, 4)


def build_pricing_table(product: Product, margins: List[MarginSetting]) -> List[Dict]:
    """
    Build a pricing table showing selling price and profit for each margin level.
    Uses the stored prices from the Excel where available, otherwise calculates them.
    """
    stored_prices = {
        0.15: product.price_15,
        0.20: product.price_20,
        0.23: product.price_23,
        0.27: product.price_27,
        0.30: product.price_30,
    }

    rows = []
    cost = product.transfer_cost_per_set  # Cost in SAR

    for margin in margins:
        if not margin.is_active:
            continue

        pct = margin.percentage
        # Use stored price if available, otherwise calculate from list price
        stored = stored_prices.get(pct)
        if stored is not None:
            selling_price = stored
        else:
            selling_price = calculate_selling_price(product.list_price, pct)

        # GP% = (list_price - cost_SAR) / list_price
        # The stored gp values use the SAR transfer cost vs SAR list price
        gp_pct = None
        profit = None
        if selling_price and cost:
            gp_pct = calculate_gp_percentage(selling_price, cost)
            profit = calculate_profit(selling_price, cost)

        rows.append({
            "margin_id": margin.id,
            "label": margin.label,
            "percentage": pct,
            "discount_pct": round(pct * 100, 1),
            "selling_price": selling_price,
            "cost": cost,
            "profit": profit,
            "gp_percentage": gp_pct,
            "is_stored": stored is not None,
        })

    return rows


def build_cost_summary(product: Product) -> Dict:
    """Build the cost summary card for a product."""
    return {
        "fob_indoor": product.fob_price_indoor,
        "fob_outdoor": product.fob_price_outdoor,
        "fob_outdoor_sar": product.fob_outdoor_sar,
        "landed_multiplier": product.landed_multiplier,
        "packing_cost": product.packing_cost,
        "bom_cost": product.bom_cost,
        "manufacturing_cost": product.manufacturing_cost,
        "transfer_cost_indoor": product.transfer_cost,
        "transfer_cost_per_set": product.transfer_cost_per_set,
        "list_price_per_unit": product.list_price_per_unit,
        "list_price_set": product.list_price,
        "gp_at_list": product.gp_at_list,
        "gp_at_30": product.gp_at_30,
    }
