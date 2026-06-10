'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { api } from '@/lib/api';
import { FileText, Plus, Search, RefreshCw, BarChart2 } from 'lucide-react';

const C = '#00ACC1';

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: '#9E9E9E', bg: 'rgba(158,158,158,.12)' },
  sent:      { label: 'Terkirim',  color: '#2196F3', bg: 'rgba(33,150,243,.12)' },
  partial:   { label: 'Sebagian', color: '#FF9800', bg: 'rgba(255,152,0,.12)' },
  paid:      { label: 'Lunas',    color: '#4CAF50', bg: 'rgba(76,175,80,.12)' },
  overdue:   { label: 'Telat',    color: '#F44336', bg: 'rgba(244,67,54,.12)' },
  cancelled: { label: 'Batal',   color: '#616161', bg: 'rgba(97,97,97,.12)' },
};

const fmt = (v: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v ?? 0));
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.draft;
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>;
}

const STATUS_FILTERS = [
  { value: '', label: 'Semua' }, { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Terkirim' }, { value: 'partial', label: 'Sebagian' },
  { value: 'paid', label: 'Lunas' }, { value: 'overdue', label: 'Telat' },
];

export default function InvoicesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => { if (!token) router.push('/login'); }, [token]);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { search, page, limit: 20 };
      if (status) params.status = status;
      const [r, s] = await Promise.all([
        api.get('/invoices', { params }),
        api.get('/invoices/stats'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.meta?.total ?? 0);
      setStats(s.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [search, page, status, token]);
  if (!token) return null;

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Invoice</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Manajemen piutang & penagihan pelanggan</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/sales/invoices/aging')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ border: `1.5px solid ${C}`, color: C }}>
              <BarChart2 className="h-4 w-4" /> Aging
            </button>
            <button onClick={() => router.push('/sales/invoices/new')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: C }}>
              <Plus className="h-4 w-4" /> Buat Invoice
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Total', value: stats.total, color: '#1E1B4B' },
              { label: 'Draft', value: stats.draft, color: '#9E9E9E' },
              { label: 'Terkirim', value: stats.sent, color: '#2196F3' },
              { label: 'Sebagian', value: stats.partial, color: '#FF9800' },
              { label: 'Lunas', value: stats.paid, color: '#4CAF50' },
              { label: 'Telat', value: stats.overdue, color: '#F44336' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 text-center" style={{ border: '1.5px solid #EDE8F5' }}>
                <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#F5F2FB' }}>
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                style={status === f.value ? { backgroundColor: 'white', color: '#1E1B4B', boxShadow: '0 1px 3px rgba(47,43,61,.1)' } : { color: '#9CA3AF' }}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
            <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm outline-none"
              style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', backgroundColor: 'white' }}
              placeholder="Cari no. invoice atau pelanggan..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button onClick={load} className="p-2 rounded-lg" style={{ border: '1px solid #EDE8F5', color: '#9CA3AF', backgroundColor: 'white' }}>
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#FDFCFF' }}>
                  {['No. Invoice', 'Pelanggan', 'Tanggal', 'Jatuh Tempo', 'Total', 'Dibayar', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-5 py-14 text-center text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-14 text-center text-sm" style={{ color: '#9CA3AF' }}>Belum ada invoice</td></tr>
                ) : data.map((inv, i) => (
                  <tr key={inv.id} className="cursor-pointer"
                    style={{ borderBottom: i < data.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onClick={() => router.push(`/sales/invoices/${inv.id}`)}>
                    <td className="px-5 py-3.5 text-xs font-mono font-semibold" style={{ color: C }}>{inv.noInvoice}</td>
                    <td className="px-5 py-3.5 text-sm font-medium" style={{ color: '#1E1B4B' }}>{inv.customer?.name ?? '–'}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{fmtDate(inv.tanggal)}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'paid' ? '#F44336' : '#9CA3AF' }}>{fmtDate(inv.dueDate)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{fmt(inv.grandTotal)}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: '#4CAF50' }}>{fmt(inv.paidAmount)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: C, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); router.push(`/sales/invoices/${inv.id}`); }}>→</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #EDE8F5' }}>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Total: {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg text-xs disabled:opacity-40" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}>← Prev</button>
              <span className="px-3 py-1 text-xs" style={{ color: '#1E1B4B' }}>Hal {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={data.length < 20} className="px-3 py-1 rounded-lg text-xs disabled:opacity-40" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}>Next →</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
