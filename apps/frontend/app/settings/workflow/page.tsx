'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Save, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

const MODULE_META: { key: string; label: string; hasAmount: boolean }[] = [
  { key: 'purchase_order', label: 'Purchase Order', hasAmount: true },
  { key: 'expense',        label: 'Pengeluaran (Expense)', hasAmount: true },
  { key: 'leave',          label: 'Cuti & Izin', hasAmount: false },
];

interface RuleState { requireApproval: boolean; minAmount: number; }
type Rules = Record<string, RuleState>;

export default function WorkflowSettingsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [rules, setRules] = useState<Rules>({
    purchase_order: { requireApproval: true,  minAmount: 0 },
    expense:        { requireApproval: true,  minAmount: 0 },
    leave:          { requireApproval: true,  minAmount: 0 },
  });

  useEffect(() => { if (!token) router.push('/login'); }, [token]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workflow/config');
      const c = res.data;
      setRules({
        purchase_order: { requireApproval: !!c.requireApprovalPO,      minAmount: c.poApprovalLimit ?? 0 },
        expense:        { requireApproval: !!c.requireApprovalExpense,  minAmount: c.expenseApprovalLimit ?? 0 },
        leave:          { requireApproval: !!c.requireApprovalLeave,    minAmount: 0 },
      });
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchConfig(); }, [token]);

  const toggle = (key: string) =>
    setRules(prev => ({ ...prev, [key]: { ...prev[key], requireApproval: !prev[key].requireApproval } }));

  const setAmount = (key: string, amount: number) =>
    setRules(prev => ({ ...prev, [key]: { ...prev[key], minAmount: amount } }));

  const handleSave = async (module: string) => {
    setSaving(module);
    try {
      await api.put('/workflow/config', { module, requireApproval: rules[module].requireApproval, minAmount: rules[module].minAmount });
      alert('Konfigurasi disimpan');
    } catch { alert('Gagal menyimpan'); }
    finally { setSaving(null); }
  };

  if (!token) return null;

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/settings/workflow">
      <div className="p-6 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Konfigurasi Approval Workflow</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Atur aturan persetujuan per modul</p>
          </div>
          <button onClick={fetchConfig} disabled={loading} className="p-2 rounded-lg" style={{ border: '1.5px solid #EDE8F5' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Memuat konfigurasi...</div>
        ) : (
          <div className="space-y-4">
            {MODULE_META.map((meta) => {
              const rule = rules[meta.key];
              return (
                <div key={meta.key} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: '#1E1B4B' }}>{meta.label}</h3>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Modul: {meta.key}</p>
                    </div>
                    <button onClick={() => toggle(meta.key)} className="flex items-center gap-2 text-sm font-medium">
                      {rule.requireApproval
                        ? <ToggleRight className="h-6 w-6" style={{ color: '#7367F0' }} />
                        : <ToggleLeft className="h-6 w-6" style={{ color: '#9CA3AF' }} />
                      }
                      <span style={{ color: rule.requireApproval ? '#7367F0' : '#9CA3AF' }}>
                        {rule.requireApproval ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </button>
                  </div>
                  {rule.requireApproval && meta.hasAmount && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
                        Minimum Nominal (Rp)
                      </label>
                      <input
                        type="number"
                        value={rule.minAmount}
                        onChange={(e) => setAmount(meta.key, Number(e.target.value))}
                        placeholder="0 = semua dokumen perlu approval"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        style={{ borderColor: '#E5E7EB' }}
                      />
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                        Dokumen dengan nominal ≥ nilai ini memerlukan approval
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => handleSave(meta.key)}
                    disabled={saving === meta.key}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white"
                    style={{ background: '#7367F0' }}
                  >
                    <Save className="h-4 w-4" />
                    {saving === meta.key ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
