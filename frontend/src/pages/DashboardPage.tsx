import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { DashboardStats, ProductListItem } from '../types';
import { Card, CardHeader, CardBody, StatCard, LoadingState, formatCurrency } from '../components/UI';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your pricing data</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Products" value={stats?.total_products ?? 0} icon="📦" color="blue" />
        <StatCard label="Total Brands" value={stats?.total_brands ?? 0} icon="🏷️" color="green" />
        <StatCard label="Total Suppliers" value={stats?.total_suppliers ?? 0} icon="🏭" color="yellow" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recently Updated Products</h2>
            <Link to="/products" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mode</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">List Price</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(stats?.recent_updates ?? []).map((p: ProductListItem) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-3">
                      <Link to={`/products/${p.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {p.indoor_model || p.indoor_epn || `Product #${p.id}`}
                      </Link>
                      {p.outdoor_model && <p className="text-xs text-gray-400 mt-0.5">{p.outdoor_model}</p>}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{p.brand || '—'}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{p.mode || '—'}</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(p.list_price)}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-400 text-xs">{formatDate(p.updated_at)}</td>
                  </tr>
                ))}
                {!stats?.recent_updates?.length && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No products yet. Import an Excel file to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
