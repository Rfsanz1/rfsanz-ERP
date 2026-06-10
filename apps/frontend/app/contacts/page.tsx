'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import ContactTable from '../../components/contacts/ContactTable';
import { api } from '../../lib/api';
import { Users, Plus, Search, RefreshCw } from 'lucide-react';

const TYPE_FILTERS = [
  { value: 'all',      label: 'Semua' },
  { value: 'customer', label: 'Pelanggan' },
  { value: 'supplier', label: 'Pemasok' },
  { value: 'both',     label: 'Keduanya' },
  { value: 'employee', label: 'Karyawan' },
];

export default function ContactsPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  const [data, setData]           = useState<any[]>([]);
  const [summary, setSummary]     = useState<any>(null);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);

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
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="flex items-center gap-2" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              <Users size={20} style={{ color: '#6366F1' }} /> Kontak
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Manajemen pelanggan, pemasok &amp; kontak bisnis terpadu</p>
          </div>
          <button onClick={() => router.push('/contacts/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Kontak
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Kontak', value: summary.total,    accent: '#6366F1' },
              { label: 'Aktif',        value: summary.active,   accent: '#10B981' },
              { label: 'Nonaktif',     value: summary.inactive, accent: '#94A3B8' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: s.accent, margin: 0 }}>{s.value ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div style={{ display: 'flex', gap: 3, padding: 4, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {TYPE_FILTERS.map(f => (
              <button key={f.value} onClick={() => { setTypeFilter(f.value); setPage(1); }}
                style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s',
                  background: typeFilter === f.value ? '#6366F1' : 'transparent',
                  color: typeFilter === f.value ? '#fff' : 'var(--text-muted)' }}>
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama, kode, telepon, email…"
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 9, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
          </div>

          <button onClick={load}
            style={{ padding: '8px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <RefreshCw size={13} />
          </button>
        </div>

        <ContactTable data={data} loading={loading} total={total} page={page} onPageChange={setPage} />
      </div>
    </AppShell>
  );
}
