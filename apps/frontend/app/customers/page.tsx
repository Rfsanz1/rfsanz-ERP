'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../lib/nav-configs';
import { api } from '../../lib/api';
import { Users, Plus, Search, RefreshCw, Star, MessageSquare } from 'lucide-react';

const SUB_NAV = [
  { label: 'Semua Pelanggan', href: '/customers' },
  { label: 'Loyalty Points',  href: '/customers/loyalty' },
  { label: 'WhatsApp Log',    href: '/customers/whatsapp-log' },
];

export default function CustomersPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        api.get('/customers', { params: { search, page, limit: 20 } }),
        api.get('/customers/summary'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
      setSummary(s.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [search, page, token]);

  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/customers">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Data Pelanggan</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Manajemen data pelanggan & riwayat transaksi</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: CRM_CONFIG.appColor }}>
            <Plus className="h-4 w-4" /> Tambah Pelanggan
          </button>
        </div>

        {/* sub nav */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#F5F2FB' }}>
          {SUB_NAV.map((n) => (
            <a key={n.href} href={n.href} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition"
              style={n.href === '/customers' ? { backgroundColor: 'white', color: '#1E1B4B', boxShadow: '0 1px 3px rgba(47,43,61,.1)' } : { color: '#9CA3AF' }}>
              {n.label}
            </a>
          ))}
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Pelanggan', value: summary.total, color: '#8E24AA', bg: 'rgba(142,36,170,.1)' },
              { label: 'Pelanggan Aktif', value: summary.active, color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
              { label: 'Tidak Aktif',     value: summary.inactive, color: '#9CA3AF', bg: 'rgba(165,163,174,.1)' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#1E1B4B' }}>{s.value ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari pelanggan..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <button onClick={load} className="p-2 rounded-lg" style={{ border: '1px solid #EDE8F5', color: '#9CA3AF' }}>
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                  {['Nama', 'Email', 'Telepon', 'Kota', 'Status'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>Belum ada pelanggan</td></tr>
                ) : data.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < data.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#8E24AA' }}>{c.name?.charAt(0)}</div>
                        <span className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{c.email || '–'}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{c.phone || '–'}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{c.city || '–'}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ color: c.active ? '#4CAF50' : '#9CA3AF', backgroundColor: c.active ? 'rgba(76,175,80,.1)' : 'rgba(165,163,174,.12)' }}>
                        {c.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid #EDE8F5' }}>
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
