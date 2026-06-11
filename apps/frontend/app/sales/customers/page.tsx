'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, RefreshCw, Plus, MapPin, Phone } from 'lucide-react';

const C = { primary: '#7C3AED', border: '#EDE9FE', textDark: '#1E1B4B', textMid: '#6B7280', textLight: '#9CA3AF' };

const DEMO: any[] = [
  { id: 'c1', name: 'PT Maju Sejahtera',     phone: '021-555-1234', city: 'Jakarta',  totalTransaction: 48500000, lastOrderDate: '2024-01-15', orderCount: 12 },
  { id: 'c2', name: 'CV Berkah Jaya',         phone: '022-444-5678', city: 'Bandung',  totalTransaction: 22750000, lastOrderDate: '2024-01-14', orderCount: 7  },
  { id: 'c3', name: 'Toko Bangunan Sejuk',    phone: '031-333-9012', city: 'Surabaya', totalTransaction: 15300000, lastOrderDate: '2024-01-13', orderCount: 4  },
  { id: 'c4', name: 'UD Subur Makmur',        phone: '0251-222-3456', city: 'Bogor',   totalTransaction: 8900000,  lastOrderDate: '2024-01-10', orderCount: 3  },
  { id: 'c5', name: 'PT Karya Abadi Sentosa', phone: '024-111-7890', city: 'Semarang', totalTransaction: 31200000, lastOrderDate: '2024-01-08', orderCount: 9 },
];

export default function CustomersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers?limit=50');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cities = [...new Set(rows.map(r => r.city).filter(Boolean))];
  const filtered = rows.filter(r =>
    (!cityFilter || r.city === cityFilter) &&
    (!search || (r.name + (r.phone ?? '') + (r.city ?? '')).toLowerCase().includes(search.toLowerCase()))
  );

  const formatRp = (v: number) => v >= 1e9 ? `Rp ${(v / 1e9).toFixed(1)} M` : v >= 1e6 ? `Rp ${(v / 1e6).toFixed(1)} Jt` : `Rp ${Number(v).toLocaleString('id-ID')}`;
  const formatDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textDark, margin: '0 0 4px' }}>Pelanggan</h2>
          <p style={{ fontSize: 13, color: C.textLight, margin: 0 }}>{rows.length} pelanggan terdaftar</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Pelanggan
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama / telepon…"
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 13, boxSizing: 'border-box', color: C.textDark }} />
        </div>
        {cities.length > 0 && (
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 13, cursor: 'pointer', color: C.textMid }}>
            <option value="">Semua Kota</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Pelanggan tidak ditemukan</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {filtered.map(r => (
            <div key={r.id} onClick={() => router.push(`/sales/customers/${r.id}`)}
              style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, padding: 18, cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.primary; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${C.primary}18`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${C.primary}30, ${C.primary}15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                  {r.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: C.textDark, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={10} style={{ color: C.textLight }} />
                    <span style={{ fontSize: 11, color: C.textLight }}>{r.city ?? '–'}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Phone size={11} style={{ color: C.textLight }} />
                <span style={{ fontSize: 12, color: C.textMid }}>{r.phone ?? '–'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                <div>
                  <p style={{ fontSize: 10, color: C.textLight, margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 600 }}>Total Transaksi</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.primary, margin: 0 }}>{formatRp(r.totalTransaction ?? 0)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 10, color: C.textLight, margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 600 }}>Order Terakhir</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.textMid, margin: 0 }}>{formatDate(r.lastOrderDate)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
