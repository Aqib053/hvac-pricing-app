import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { chargesApi, getErrorMessage } from '../../services/api';
import { Charge } from '../../types';
import { Card, CardHeader, CardBody, Input, Button, LoadingState } from '../../components/UI';

interface ChargeFormState {
  customs_pct: string;
  freight_pct: string;
  handling_pct: string;
  notes: string;
}

export function AdminChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, ChargeFormState>>({});

  useEffect(() => {
    chargesApi.list().then(data => {
      setCharges(data);
      const initial: Record<string, ChargeFormState> = {};
      data.forEach(c => {
        initial[c.category] = {
          customs_pct: String(c.customs_pct),
          freight_pct: String(c.freight_pct),
          handling_pct: String(c.handling_pct),
          notes: c.notes || '',
        };
      });
      setForms(initial);
    }).finally(() => setLoading(false));
  }, []);

  function updateForm(category: string, field: keyof ChargeFormState, value: string) {
    setForms(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
  }

  async function handleSave(category: string) {
    const f = forms[category];
    if (!f) return;
    setSaving(category);
    try {
      const updated = await chargesApi.update(category, {
        customs_pct: parseFloat(f.customs_pct) || 0,
        freight_pct: parseFloat(f.freight_pct) || 0,
        handling_pct: parseFloat(f.handling_pct) || 0,
        notes: f.notes || undefined,
      });
      setCharges(prev => prev.map(c => c.category === category ? updated : c));
      toast.success(`Charges for ${updated.label || category} updated`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Charges Configuration</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Edit customs, freight, and handling charges. Changes immediately affect pricing calculations.
        </p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Multiplier formula:</strong> 1 + (Customs% / 100) + (Freight% / 100) + (Handling% / 100)
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          For example: 15% customs + 0% freight + 1% handling = multiplier of 1.16
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charges.map(charge => {
          const f = forms[charge.category] || { customs_pct: '0', freight_pct: '0', handling_pct: '0', notes: '' };
          const calculatedMultiplier = (
            1 +
            (parseFloat(f.customs_pct) || 0) / 100 +
            (parseFloat(f.freight_pct) || 0) / 100 +
            (parseFloat(f.handling_pct) || 0) / 100
          ).toFixed(4);

          return (
            <Card key={charge.category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                      {charge.label || charge.category}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Category: {charge.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current multiplier</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{charge.multiplier.toFixed(4)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Customs %"
                    type="number"
                    step="0.1"
                    min="0"
                    value={f.customs_pct}
                    onChange={e => updateForm(charge.category, 'customs_pct', e.target.value)}
                  />
                  <Input
                    label="Freight %"
                    type="number"
                    step="0.1"
                    min="0"
                    value={f.freight_pct}
                    onChange={e => updateForm(charge.category, 'freight_pct', e.target.value)}
                  />
                  <Input
                    label="Handling %"
                    type="number"
                    step="0.1"
                    min="0"
                    value={f.handling_pct}
                    onChange={e => updateForm(charge.category, 'handling_pct', e.target.value)}
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">New multiplier preview</span>
                  <span className="text-base font-bold text-green-600 dark:text-green-400">{calculatedMultiplier}</span>
                </div>

                <Input
                  label="Notes (optional)"
                  value={f.notes}
                  onChange={e => updateForm(charge.category, 'notes', e.target.value)}
                  placeholder="Any notes about this charge category..."
                />

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSave(charge.category)}
                    loading={saving === charge.category}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}

        {!charges.length && (
          <div className="col-span-2 text-center py-16 text-gray-500">
            No charge categories found. Import an Excel file to initialize charges.
          </div>
        )}
      </div>
    </div>
  );
}
