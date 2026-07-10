export interface User {
  email: string;
  full_name: string | null;
  is_admin: boolean;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  is_admin: boolean;
  full_name: string | null;
  email: string;
}

export interface Product {
  id: number;
  supplier: string | null;
  brand: string | null;
  capacity: number | null;
  unit_type: string | null;
  mode: string | null;
  refrigerant: string | null;
  product_type: string | null;
  country: string | null;
  indoor_epn: string | null;
  indoor_model: string | null;
  outdoor_epn: string | null;
  outdoor_model: string | null;
  qty_forecast: number | null;
  fob_price_indoor: number | null;
  fob_price_outdoor: number | null;
  fob_outdoor_sar: number | null;
  landed_multiplier: number | null;
  packing_cost: number | null;
  bom_cost: number | null;
  manufacturing_cost: number | null;
  transfer_cost: number | null;
  transfer_cost_per_set: number | null;
  list_price_per_unit: number | null;
  list_price: number | null;
  gp_at_list: number | null;
  price_15: number | null;
  price_20: number | null;
  price_23: number | null;
  price_27: number | null;
  price_30: number | null;
  gp_at_30: number | null;
  extra_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductListItem {
  id: number;
  supplier: string | null;
  brand: string | null;
  capacity: number | null;
  mode: string | null;
  product_type: string | null;
  indoor_epn: string | null;
  indoor_model: string | null;
  outdoor_epn: string | null;
  outdoor_model: string | null;
  list_price: number | null;
  transfer_cost_per_set: number | null;
  updated_at: string;
}

export interface PaginatedProducts {
  items: ProductListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CostSummary {
  fob_indoor: number | null;
  fob_outdoor: number | null;
  fob_outdoor_sar: number | null;
  landed_multiplier: number | null;
  packing_cost: number | null;
  bom_cost: number | null;
  manufacturing_cost: number | null;
  transfer_cost_indoor: number | null;
  transfer_cost_per_set: number | null;
  list_price_per_unit: number | null;
  list_price_set: number | null;
  gp_at_list: number | null;
  gp_at_30: number | null;
}

export interface PricingRow {
  margin_id: number;
  label: string;
  percentage: number;
  discount_pct: number;
  selling_price: number | null;
  cost: number | null;
  profit: number | null;
  gp_percentage: number | null;
  is_stored: boolean;
}

export interface ProductDetail {
  product: Product;
  cost_summary: CostSummary;
  pricing_table: PricingRow[];
}

export interface Charge {
  id: number;
  category: string;
  label: string | null;
  customs_pct: number;
  freight_pct: number;
  handling_pct: number;
  multiplier: number;
  notes: string | null;
  updated_at: string;
}

export interface MarginSetting {
  id: number;
  percentage: number;
  label: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_products: number;
  total_brands: number;
  total_suppliers: number;
  recent_updates: ProductListItem[];
}

export interface FilterOptions {
  suppliers: string[];
  brands: string[];
  modes: string[];
  product_types: string[];
  capacities: number[];
}

export interface ImportResult {
  success: boolean;
  message: string;
  details: {
    products_imported: number;
    products_updated: number;
    charges_imported: number;
    errors: string[];
    warnings: string[];
  };
}
