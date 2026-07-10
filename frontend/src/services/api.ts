import axios from 'axios';
import type {
  Product, ProductListItem, PaginatedProducts,
  ProductDetail, Charge, MarginSetting, DashboardStats,
  FilterOptions, ImportResult
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d: { msg: string }) => d.msg).join(', ');
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

// Dashboard
export const dashboardApi = {
  get: async (): Promise<DashboardStats> => {
    const { data } = await api.get<DashboardStats>('/dashboard');
    return data;
  },
};

// Products
export const productsApi = {
  list: async (params: Record<string, string | number | undefined>): Promise<PaginatedProducts> => {
    const { data } = await api.get<PaginatedProducts>('/products', { params });
    return data;
  },

  getById: async (id: number): Promise<ProductDetail> => {
    const { data } = await api.get<ProductDetail>(`/products/${id}`);
    return data;
  },

  create: async (product: Partial<Product>): Promise<Product> => {
    const { data } = await api.post<Product>('/products', product);
    return data;
  },

  update: async (id: number, product: Partial<Product>): Promise<Product> => {
    const { data } = await api.put<Product>(`/products/${id}`, product);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  getFilters: async (): Promise<FilterOptions> => {
    const { data } = await api.get<FilterOptions>('/products/filters');
    return data;
  },
};

// Charges
export const chargesApi = {
  list: async (): Promise<Charge[]> => {
    const { data } = await api.get<Charge[]>('/charges');
    return data;
  },

  update: async (category: string, charge: { customs_pct: number; freight_pct: number; handling_pct: number; notes?: string }): Promise<Charge> => {
    const { data } = await api.put<Charge>(`/charges/${category}`, charge);
    return data;
  },
};

// Margins
export const marginsApi = {
  list: async (): Promise<MarginSetting[]> => {
    const { data } = await api.get<MarginSetting[]>('/margins');
    return data;
  },

  create: async (margin: { percentage: number; label?: string; is_active?: boolean; sort_order?: number }): Promise<MarginSetting> => {
    const { data } = await api.post<MarginSetting>('/margins', margin);
    return data;
  },

  update: async (id: number, margin: Partial<{ percentage: number; label: string; is_active: boolean; sort_order: number }>): Promise<MarginSetting> => {
    const { data } = await api.put<MarginSetting>(`/margins/${id}`, margin);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/margins/${id}`);
  },
};

// Import
export const importApi = {
  uploadExcel: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<ImportResult>('/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export default api;
