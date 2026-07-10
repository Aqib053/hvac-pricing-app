import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../services/api';
import { PaginatedProducts, FilterOptions } from '../types';
import { Card, CardBody, Input, Select, Button, LoadingState, EmptyState, Pagination, Badge, formatCurrency } from '../components/UI';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function ProductSearchPage() {
  const [search, setSearch] = useState('');
  const [supplier, setSupplier] = useState('');
  const [brand, setBrand] = useState('');
  const [mode, setMode] = useState('');
  const [productType, setProductType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [page, setPage] = useState(1);

  const [results, setResults] = useState<PaginatedProducts | null>(null);
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    productsApi.getFilters().then(setFilters);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        page_size: 20,
      };
      if (debouncedSearch) params.q = debouncedSearch;
      if (supplier) params.supplier = supplier;
      if (brand) params.brand = brand;
      if (mode) params.mode = mode;
      if (productType) params.product_type = productType;
      if (capacity) params.capacity = parseInt(capacity);

      const data = await productsApi.list(params);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, supplier, brand, mode, productType, capacity, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, supplier, brand, mode, productType, capacity]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetFilters = () => {
    setSearch('');
    setSupplier('');
    setBrand('');
    setMode('');
    setProductType('');
    setCapacity('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Product Search</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Search and filter HVAC pricing products</p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardBody>
          <div className="space-y-4">
            <Input
              placeholder="Search by model, EPN, supplier, brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-base"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Select
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                options={[{ value: '', label: 'All Suppliers' }, ...(filters?.suppliers || []).map(s => ({ value: s, label: s }))]}
              />
              <Select
                value={brand}
                onChange={e => setBrand(e.target.value)}
                options={[{ value: '', label: 'All Brands' }, ...(filters?.brands || []).map(b => ({ value: b, label: b }))]}
              />
              <Select
                value={mode}
                onChange={e => setMode(e.target.value)}
                options={[{ value: '', label: 'All Modes' }, ...(filters?.modes || []).map(m => ({ value: m, label: m }))]}
              />
              <Select
                value={productType}
                onChange={e => setProductType(e.target.value)}
                options={[{ value: '', label: 'All Types' }, ...(filters?.product_types || []).map(t => ({ value: t, label: t }))]}
              />
              <Select
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                options={[
                  { value: '', label: 'All Capacities' },
                  ...(filters?.capacities || []).map(c => ({ value: c, label: `${c}K BTU` })),
                ]}
              />
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={resetFilters}>Clear filters</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Results */}
      <Card>
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {results ? `${results.total} product${results.total !== 1 ? 's' : ''} found` : 'Loading...'}
          </p>
        </div>

        {loading ? (
          <LoadingState />
        ) : !results?.items?.length ? (
          <EmptyState message="No products match your search" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Indoor Model</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Outdoor Model</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand / Mode</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capacity</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">List Price</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transfer Cost</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {results.items.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{p.indoor_model || '—'}</p>
                        <p className="text-xs text-gray-400">{p.indoor_epn}</p>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-gray-600 dark:text-gray-300">{p.outdoor_model || '—'}</p>
                        <p className="text-xs text-gray-400">{p.outdoor_epn}</p>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-gray-600 dark:text-gray-300">{p.brand || '—'}</p>
                        {p.mode && <Badge color="blue">{p.mode}</Badge>}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {p.capacity ? (
                          <Badge color="gray">{p.capacity}K BTU</Badge>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(p.list_price)}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600 dark:text-gray-300">
                        {formatCurrency(p.transfer_cost_per_set)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link to={`/products/${p.id}`}>
                          <Button variant="ghost" size="sm">View →</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <Pagination page={page} totalPages={results.total_pages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
