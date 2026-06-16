'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { ArrowDownRight, Search, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../../../lib/api';

const C = ACCOUNTING_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const COLUMNS = [
  { key: 'current',   label: 'Belum JT',   color: '#4CAF50' },
  { key: 'days1_30',  label: '1-30 Hari',  color: '#FF9800' },
  { key: 'days31_60', label: '31-60 Hari', color: '#FF5722' },
  { key: 'days61_90', label: '61-90 Hari', color: '#F44336' },
  { key: 'over90',    label: '> 90 Hari',  color: '#B71C1C' },
];

export default function AgedPayablePage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/finance/ap-aging', { params: { asOfDate } });
      setData(res.data ?? res ?? []);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [asOfDate]);

  useEffect(() => { if (token) load(); }, [load, token]);


  const filtered = data.filter(d => !search || (d.supplier ?? d.supplierName ?? '').toLowerCase().includes(search.toLowerCase()));

  const totals = COLUMNS.reduce((acc, col) => {
    acc[col.key] = filtered.reduce((s, d) => s + Number(d[col.key] ?? 0), 0);
    return acc;
  }, {} as Record<string, number>);
  totals.total = filtered.reduce((s, d) => s + Number(d.total ?? 0), 0);

  const overdue = (totals.days31_60 ?? 0) + (totals.days61_90 ?? 0) + (totals.over90 ?? 0);

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV}>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Aging Hutang (AP Aging)</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Analisa umur hutang supplier berdasarkan tanggal jatuh tempo</p>
          </div>
          <div className="flex gap-2">
            <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} />
            <button onClick={load} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
              <RefreshCw className="h-4 w-4" /> Muat
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Hutang',          value: fmt(totals.total ?? 0),   color: C },
            { label: 'Belum Jatuh Tempo',     value: fmt(totals.current ?? 0), color: '#4CAF50' },
            { label: 'Sudah Jatuh Tempo',     value: fmt(overdue),             color: '#EA5455' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-lg font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari supplier..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {loading && <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#9CA3AF' }} />}
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Memuat data aging hutang...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                    <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>Supplier</th>
                    {COLUMNS.map(col => (
                      <th key={col.key} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: col.color }}>{col.label}</th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-semibold" style={{ color: '#1E1B4B' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium" style={{ color: '#1E1B4B' }}>
                        <div className="flex items-center gap-2">
                          {Number(d.over90) > 0 && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#B71C1C' }} />}
                          {d.supplier ?? d.supplierName}
                        </div>
                      </td>
                      {COLUMNS.map(col => (
                        <td key={col.key} className="px-4 py-3 text-right text-xs" style={{ color: Number(d[col.key]) > 0 ? col.color : '#9CA3AF' }}>
                          {Number(d[col.key]) > 0 ? fmt(Number(d[col.key])) : '-'}
                        </td>
                      ))}
                      <td className="px-6 py-3 text-right font-bold text-sm" style={{ color: '#1E1B4B' }}>{fmt(Number(d.total))}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr><td colSpan={7} className="text-center py-10 text-sm" style={{ color: '#9CA3AF' }}>Tidak ada data hutang</td></tr>
                  )}
                  {filtered.length > 0 && (
                    <tr style={{ borderTop: '2px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                      <td className="px-6 py-3 font-bold text-sm" style={{ color: '#1E1B4B' }}>TOTAL</td>
                      {COLUMNS.map(col => (
                        <td key={col.key} className="px-4 py-3 text-right font-bold text-sm" style={{ color: col.color }}>{fmt(totals[col.key] ?? 0)}</td>
                      ))}
                      <td className="px-6 py-3 text-right font-bold text-sm" style={{ color: '#1E1B4B' }}>{fmt(totals.total ?? 0)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
