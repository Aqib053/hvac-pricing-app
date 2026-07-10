import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { marginsApi, getErrorMessage } from '../../services/api';
import { MarginSetting } from '../../types';
import { Card, CardHeader, CardBody, Input, Button, LoadingState, Badge } from '../../components/UI';

export function AdminMarginsPage() {
  const [margins, setMargins] = useState<MarginSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPct, setNewPct] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPct, setEditPct] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    marginsApi.list().then(setMargins).finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    const pct = parseFloat(newPct);
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      toast.error('Enter a valid percentage between 0 and 100');
      return;
    }
    setAdding(true);
    try {
      const created = await marginsApi.create({
        percentage: pct / 100,
        label: newLabel || `${pct}%`,
        is_active: true,
        sort_order: margins.length,
      });
      setMargins(prev => [...prev, created]);
      setNewPct('');
      setNewLabel('');
      toast.success('Margin added');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit(id: number) {
    const pct = parseFloat(editPct);
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      toast.error('Enter a valid percentage');
      return;
    }
    setSavingId(id);
    try {
      const updated = await marginsApi.update(id, {
        percentage: pct / 100,
        label: editLabel || `${pct}%`,
      });
      setMargins(prev => prev.map(m => m.id === id ? updated : m));
      setEditingId(null);
      toast.success('Margin updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggle(margin: MarginSetting) {
    try {
      const updated = await marginsApi.update(margin.id, { is_active: !margin.is_active });
      setMargins(prev => prev.map(m => m.id === margin.id ? updated : m));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this margin setting?')) return;
    setDeletingId(id);
    try {
      await marginsApi.delete(id);
      setMargins(prev => prev.filter(m => m.id !== id));
      toast.success('Margin deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Margin Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Configure discount percentages shown in product pricing tables
        </p>
      </div>

      {/* Add new */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Add New Margin</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Percentage (%)"
                type="number"
                step="0.1"
                min="0.1"
                max="99.9"
                value={newPct}
                onChange={e => setNewPct(e.target.value)}
                placeholder="e.g. 25"
              />
              <Input
                label="Label (optional)"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Standard"
              />
            </div>
            <Button onClick={handleAdd} loading={adding} className="w-full sm:w-auto">
              Add Margin
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Configured Margins ({margins.length})
          </h2>
        </CardHeader>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {margins.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">No margins configured</div>
          )}
          {margins.map(m => (
            <div key={m.id} className="p-4">
              {editingId === m.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Percentage (%)" type="number" step="0.1" value={editPct} onChange={e => setEditPct(e.target.value)} />
                    <Input label="Label" value={editLabel} onChange={e => setEditLabel(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="w-full" onClick={() => handleSaveEdit(m.id)} loading={savingId === m.id}>Save</Button>
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Info row */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(m.percentage * 100)}%
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{m.label}</p>
                      <p className="text-xs text-gray-400">Discount: {(m.percentage * 100).toFixed(1)}%</p>
                    </div>
                    <Badge color={m.is_active ? 'green' : 'gray'}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {/* 3 buttons — equal grid, no overflow */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button size="sm" variant="secondary" className="w-full text-xs truncate" onClick={() => handleToggle(m)}>
                      {m.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={() => {
                        setEditingId(m.id);
                        setEditPct(String(Math.round(m.percentage * 10000) / 100));
                        setEditLabel(m.label || '');
                      }}
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" className="w-full text-xs" loading={deletingId === m.id} onClick={() => handleDelete(m.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
