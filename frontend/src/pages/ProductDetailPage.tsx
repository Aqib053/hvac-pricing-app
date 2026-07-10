import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsApi } from '../services/api';
import { ProductDetail, PricingRow } from '../types';
import {
  Card, CardHeader, CardBody, LoadingState, Badge, Button,
  InfoRow, formatCurrency, formatUSD, formatPct
} from '../components/UI';
function GpBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-400">—</span>;
  const pct = value * 100;
  const color = pct >= 25 ? 'green' : pct >= 20 ? 'yellow' : 'red';
  return <Badge color={color}>{pct.toFixed(2)}%</Badge>;
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    productsApi.getById(parseInt(id))
      .then(setDetail)
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (!detail) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Product not found.</p>
      <Link to="/products"><Button className="mt-4" variant="secondary">← Back to Search</Button></Link>
    </div>
  );

  const { product: p, cost_summary: cs, pricing_table } = detail;
  const title = p.indoor_model || p.indoor_epn || `Product #${p.id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/products" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Products</Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          <div className="flex items-center gap-2 mt-2">
            {p.brand && <Badge color="blue">{p.brand}</Badge>}
            {p.mode && <Badge color="green">{p.mode}</Badge>}
            {p.product_type && <Badge color="gray">{p.product_type}</Badge>}
            {p.capacity && <Badge color="yellow">{p.capacity}K BTU</Badge>}
          </div>
        </div>
        <Link to={`/admin/products?edit=${p.id}`}>
          <Button variant="secondary" size="sm">✏️ Edit</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Info */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Product Information</h2>
          </CardHeader>
          <CardBody>
            <InfoRow label="Supplier" value={p.supplier} />
            <InfoRow label="Brand" value={p.brand} />
            <InfoRow label="Capacity" value={p.capacity ? `${p.capacity}K BTU` : null} />
            <InfoRow label="Unit Type" value={p.unit_type} />
            <InfoRow label="Mode" value={p.mode} />
            <InfoRow label="Refrigerant" value={p.refrigerant} />
            <InfoRow label="Type" value={p.product_type} />
            <InfoRow label="Country of Origin" value={p.country} />
            <InfoRow label="2026 Qty Forecast" value={p.qty_forecast?.toLocaleString()} />
          </CardBody>
        </Card>

        {/* Models */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Model Numbers</h2>
          </CardHeader>
          <CardBody>
            <InfoRow label="Indoor EPN" value={p.indoor_epn} />
            <InfoRow label="Indoor Model" value={p.indoor_model} />
            <InfoRow label="Outdoor EPN" value={p.outdoor_epn} />
            <InfoRow label="Outdoor Model" value={p.outdoor_model} />
          </CardBody>
        </Card>

        {/* FOB & Costs */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Cost Structure</h2>
          </CardHeader>
          <CardBody>
            <InfoRow label="FOB Indoor (USD)" value={formatUSD(cs.fob_indoor)} />
            <InfoRow label="FOB Outdoor (USD)" value={formatUSD(cs.fob_outdoor)} />
            <InfoRow label="FOB Outdoor (SAR)" value={formatCurrency(cs.fob_outdoor_sar)} />
            <InfoRow label="Landed Multiplier" value={cs.landed_multiplier?.toFixed(4)} />
            <InfoRow label="Packing Cost" value={formatCurrency(cs.packing_cost)} />
            <InfoRow label="BOM Cost (SAR)" value={formatCurrency(cs.bom_cost)} />
            <InfoRow label="Manufacturing Cost" value={formatCurrency(cs.manufacturing_cost)} />
          </CardBody>
        </Card>

        {/* Transfer & List */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Transfer & List Pricing</h2>
          </CardHeader>
          <CardBody>
            <InfoRow label="Transfer Cost (Indoor)" value={formatCurrency(cs.transfer_cost_indoor)} />
            <InfoRow label="Transfer Cost (Per Set)" value={formatCurrency(cs.transfer_cost_per_set)} />
            <InfoRow label="List Price (Per Unit)" value={formatCurrency(cs.list_price_per_unit)} />
            <InfoRow label="List Price (Full Set)" value={formatCurrency(cs.list_price_set)} />
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">GP at 0% Discount</span>
              <GpBadge value={cs.gp_at_list} />
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">GP at 30% Discount</span>
              <GpBadge value={cs.gp_at_30} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Discount Pricing Table</h2>
          <p className="text-xs text-gray-400 mt-1">Selling prices at each discount tier based on the list price of {formatCurrency(p.list_price)}</p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Discount</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Selling Price (SAR)</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost (SAR)</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profit (SAR)</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">GP%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pricing_table.map((row: PricingRow) => (
                <tr key={row.margin_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{row.label}</span>
                    {row.is_stored && (
                      <span className="ml-2 text-xs text-gray-400">(from Excel)</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(row.selling_price)}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600 dark:text-gray-300">
                    {formatCurrency(row.cost)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {row.profit !== null ? (
                      <span className={row.profit >= 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600'}>
                        {formatCurrency(row.profit)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <GpBadge value={row.gp_percentage} />
                  </td>
                </tr>
              ))}
              {!pricing_table.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No margin settings configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
