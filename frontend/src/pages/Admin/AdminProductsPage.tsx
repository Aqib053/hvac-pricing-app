import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsApi, getErrorMessage } from '../../services/api';
import { Product, PaginatedProducts, FilterOptions } from '../../types';
import {
  Card, CardBody, Input, Button, LoadingState, EmptyState,
  Pagination, Badge, formatCurrency, Select
} from '../../components/UI';

// ─── Shared form hook ────────────────────────────────────────────────────────
function useProductForm(initial: Partial<Product> = {}) {
  const [form, setForm] = useState<Partial<Product>>(initial);

  const numField = (key: keyof Product) => ({
    type: 'number' as const,
    value: (form[key] as number | null) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value === '' ? null : parseFloat(e.target.value) })),
  });

  const strField = (key: keyof Product) => ({
    value: (form[key] as string | null) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value || null })),
  });

  return { form, numField, strField };
}

// ─── Shared form fields ──────────────────────────────────────────────────────
function ProductFormFields({ numField, strField }: {
  numField: ReturnType<typeof useProductForm>['numField'];
  strField: ReturnType<typeof useProductForm>['strField'];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Input label="Supplier" {...strField('supplier')} />
      <Input label="Brand" {...strField('brand')} />
      <Input label="Capacity (BTU K)" {...numField('capacity')} />
      <Input label="Unit Type" {...strField('unit_type')} />
      <Input label="Mode" {...strField('mode')} />
      <Input label="Refrigerant" {...strField('refrigerant')} />
      <Input label="Product Type" {...strField('product_type')} />
      <Input label="Country" {...strField('country')} />
      <Input label="Indoor EPN" {...strField('indoor_epn')} />
      <Input label="Indoor Model" {...strField('indoor_model')} />
      <Input label="Outdoor EPN" {...strField('outdoor_epn')} />
      <Input label="Outdoor Model" {...strField('outdoor_model')} />
      <Input label="Qty 2026 Forecast" {...numField('qty_forecast')} />
      <Input label="FOB Price Indoor (USD)" {...numField('fob_price_indoor')} step="0.01" />
      <Input label="FOB Price Outdoor (USD)" {...numField('fob_price_outdoor')} step="0.01" />
      <Input label="FOB Outdoor SAR" {...numField('fob_outdoor_sar')} step="0.01" />
      <Input label="Landed Multiplier" {...numField('landed_multiplier')} step="0.001" />
      <Input label="Packing Cost (SAR)" {...numField('packing_cost')} step="0.01" />
      <Input label="BOM Cost (SAR)" {...numField('bom_cost')} step="0.01" />
      <Input label="Manufacturing Cost (SAR)" {...numField('manufacturing_cost')} step="0.01" />
      <Input label="Transfer Cost Indoor (SAR)" {...numField('transfer_cost')} step="0.01" />
      <Input label="Transfer Cost Per Set (SAR)" {...numField('transfer_cost_per_set')} step="0.01" />
      <Input label="List Price Per Unit (SAR)" {...numField('list_price_per_unit')} step="0.01" />
      <Input label="List Price Full Set (SAR)" {...numField('list_price')} step="0.01" />
      <Input label="GP at 0% Discount" {...numField('gp_at_list')} step="0.0001" />
      <Input label="Price at 15% Discount (SAR)" {...numField('price_15')} step="0.01" />
      <Input label="Price at 20% Discount (SAR)" {...numField('price_20')} step="0.01" />
      <Input label="Price at 23% Discount (SAR)" {...numField('price_23')} step="0.01" />
      <Input label="Price at 27% Discount (SAR)" {...numField('price_27')} step="0.01" />
      <Input label="Price at 30% Discount (SAR)" {...numField('price_30')} step="0.01" />
      <Input label="GP at 30% Discount" {...numField('gp_at_30')} step="0.0001" />
    </div>
  );
}

// ─── Modal shell ─────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, onSave, saving, saveLabel, children }: {
  title: string; onClose: () => void; onSave: () => void;
  saving: boolean; saveLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4 py-8">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl z-10">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center">&times;</button>
          </div>
          <div className="p-5">{children}</div>
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={onSave} loading={saving} className="w-full sm:w-auto">{saveLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Modal ───────────────────────────────────────────────────────────────
function AddModal({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const { form, numField, strField } = useProductForm();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await productsApi.create(form);
      onSave();
      toast.success('Product created');
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Add New Product" onClose={onClose} onSave={handleSave} saving={saving} saveLabel="Create Product">
      <ProductFormFields numField={numField} strField={strField} />
    </ModalShell>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────
function EditModal({ product: initial, onSave, onClose }: {
  product: Product; onSave: () => void; onClose: () => void;
}) {
  const { form, numField, strField } = useProductForm({ ...initial });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await productsApi.update(initial.id, form);
      onSave();
      toast.success('Product updated');
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={`Edit Product #${initial.id}`} onClose={onClose} onSave={handleSave} saving={saving} saveLabel="Save Changes">
      <ProductFormFields numField={numField} strField={strField} />
    </ModalShell>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [mode, setMode] = useState('');
  const [supplier, setSupplier] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<PaginatedProducts | null>(null);
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => { productsApi.getFilters().then(setFilters); }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page, page_size: 20 };
      if (search) params.q = search;
      if (brand) params.brand = brand;
      if (mode) params.mode = mode;
      if (supplier) params.supplier = supplier;
      const data = await productsApi.list(params);
      setResults(data);

      const editId = searchParams.get('edit');
      if (editId) {
        const found = data.items.find(p => p.id === parseInt(editId));
        if (found) {
          const detail = await productsApi.getById(found.id);
          setEditingProduct(detail.product);
          setSearchParams({});
        }
      }
    } finally {
      setLoading(false);
    }
  }, [search, brand, mode, supplier, page]);

  useEffect(() => { setPage(1); }, [search, brand, mode, supplier]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleDelete(id: number) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await productsApi.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  async function openEdit(id: number) {
    try {
      const detail = await productsApi.getById(id);
      setEditingProduct(detail.product);
    } catch {
      toast.error('Failed to load product');
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Manage Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Create, edit, and delete products</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddingProduct(true)} className="flex-1 sm:flex-none">➕ Add Product</Button>
          <Link to="/admin/import" className="flex-1 sm:flex-none">
            <Button variant="secondary" className="w-full">📥 Import Excel</Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardBody>
          <div className="space-y-3">
            <Input placeholder="Search by model, EPN, brand..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="grid grid-cols-3 gap-3">
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
            </div>
            {(search || brand || mode || supplier) && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setBrand(''); setMode(''); setSupplier(''); }}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* List */}
      <Card>
        <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">{results?.total ?? 0} products found</p>
        </div>

        {loading ? <LoadingState /> : !results?.items?.length ? (
          <EmptyState message="No products found" />
        ) : (
          <>
            {/* Mobile: card list (no horizontal scroll) */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.items.map(p => (
                <div key={p.id} className="p-4 space-y-3">
                  {/* Info row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">{p.indoor_model || '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.indoor_epn}</p>
                      <p className="text-xs text-gray-500 mt-0.5">↳ {p.outdoor_model || '—'}</p>
                    </div>
                    <div className="flex-shrink-0 text-right space-y-1">
                      {p.mode && <div><Badge color="blue">{p.mode}</Badge></div>}
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(p.list_price)}</p>
                      <p className="text-xs text-gray-400">{p.brand || ''}</p>
                    </div>
                  </div>
                  {/* Action buttons — always in one row, equal width */}
                  <div className="grid grid-cols-3 gap-2">
                    <Link to={`/products/${p.id}`}>
                      <Button variant="ghost" size="sm" className="w-full text-xs">View</Button>
                    </Link>
                    <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => openEdit(p.id)}>Edit</Button>
                    <Button variant="danger" size="sm" className="w-full text-xs" loading={deletingId === p.id} onClick={() => handleDelete(p.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <Pagination page={page} totalPages={results.total_pages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      {addingProduct && (
        <AddModal onSave={() => { fetchProducts(); setAddingProduct(false); }} onClose={() => setAddingProduct(false)} />
      )}
      {editingProduct && (
        <EditModal product={editingProduct} onSave={() => { fetchProducts(); setEditingProduct(null); }} onClose={() => setEditingProduct(null)} />
      )}
    </div>
  );
}
