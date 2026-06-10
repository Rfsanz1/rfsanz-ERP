'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import ContactTable from '../../components/contacts/ContactTable';
import { api } from '../../lib/api';
import { Users, Plus, Search, RefreshCw } from 'lucide-react';

const ACCENT = '#7367F0';

const TYPE_FILTERS = [
  { value: 'all',      label: 'Semua' },
  { value: 'customer', label: 'Pelanggan' },
  { value: 'supplier', label: 'Pemasok' },
  { value: 'both',     label: 'Keduanya' },
  { value: 'employee', label: 'Karyawan' },
];

export default function ContactsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { search, page, limit: 20 };
      if (typeFilter !== 'all') params.type = typeFilter;
      const [r, s] = await Promise.all([
        api.get('/contacts', { params }),
        api.get('/contacts/summary'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
      setSummary(s.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [search, page, typeFilter, token]);
  if (!token) return null;

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Kontak</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Manajemen pelanggan, pemasok & kontak bisnis terpadu</p>
          </div>
          <button onClick={() => router.push('/contacts/new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: ACCENT }}>
            <Plus className="h-4 w-4" /> Tambah Kontak
          </button>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Kontak', value: summary.total,    color: ACCENT,     bg: 'rgba(115,103,240,.1)' },
              { label: 'Aktif',        value: summary.active,   color: '#4CAF50',  bg: 'rgba(76,175,80,.1)' },
              { label: 'Nonaktif',     value: summary.inactive, color: '#9CA3AF',  bg: 'rgba(165,163,174,.1)' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#1E1B4B' }}>{s.value ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#F5F2FB' }}>
            {TYPE_FILTERS.map((f) => (
              <button key={f.value} onClick={() => { setTypeFilter(f.value); setPage(1); }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                style={typeFilter === f.value
                  ? { backgroundColor: 'white', color: '#1E1B4B', boxShadow: '0 1px 3px rgba(47,43,61,.1)' }
                  : { color: '#9CA3AF' }}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
            <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm outline-none"
              style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', backgroundColor: 'white' }}
              placeholder="Cari nama, kode, telepon, email..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <button onClick={load} className="p-2 rounded-lg transition" style={{ border: '1px solid #EDE8F5', color: '#9CA3AF', backgroundColor: 'white' }}>
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <ContactTable data={data} loading={loading} total={total} page={page} onPageChange={setPage} />
      </div>
    </AppShell>
  );
}
