'use client';
import { useEffect, useState } from 'react';
import ModernLayout from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { Building2, Plus, Search, RefreshCw, Globe } from 'lucide-react';

const PURCHASING_CONFIG = {
  appName: 'Pembelian',
  accentColor: '#5D4037',
  logoText: 'PB',
};
const PURCHASING_NAV = [
  { label: 'RFQ', href: '/purchasing/rfq' },
  { label: 'Purchase Order', href: '/purchasing/purchase-orders' },
  { label: 'Penerimaan', href: '/purchasing/goods-receipts' },
  { label: 'Vendor Bill', href: '/purchasing/bills' },
  { label: 'Supplier', href: '/purchasing/suppliers' },
  { label: 'Laporan', href: '/purchasing/reports' },
];

const IDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

interface Supplier {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  active?: boolean;
  piutang?: number;
  hutang?: number;
  source: 'local' | 'kledo';
  kledoId?: number;
}

export default function SuppliersPage() {
  const [data, setData]       = useState<Supplier[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const PER_PAGE = 25;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [localRes, kledoRes] = await Promise.allSettled([
        api.get('/purchasing/suppliers', { params: { search, page, limit: PER_PAGE } }),
        api.get('/kledo/contacts', { params: { type: 'vendor', per_page: 500, search: search || undefined } }),
      ]);

      const localItems: Supplier[] = localRes.status === 'fulfilled'
        ? (localRes.value.data?.data?.data ?? localRes.value.data?.data ?? []).map((s: any) => ({
            id: String(s.id),
            name: s.name ?? '',
            code: s.code,
            phone: s.phone,
            email: s.email,
            city: s.city,
            address: s.address,
            active: s.active !== false,
            source: 'local' as const,
          }))
        : [];

      const kledoItems: Supplier[] = kledoRes.status === 'fulfilled'
        ? ((kledoRes.value.data?.data?.data ?? kledoRes.value.data?.data ?? []) as any[])
            .filter((k: any) => k.name)
            .map((k: any) => ({
              id: `kledo-${k.id}`,
              kledoId: k.id,
              name: k.name ?? '',
              code: k.code ?? '',
              phone: k.phone ?? '',
              email: k.email ?? '',
              address: k.address ?? '',
              active: true,
              piutang: Number(k.receivable ?? 0),
              hutang: Number(k.payable ?? 0),
              source: 'kledo' as const,
            }))
        : [];

      // Merge: local utama, kledo tambahan (de-dup by name)
      const localNames = new Set(localItems.map(s => s.name.toLowerCase().trim()));
      const kledoUniq = kledoItems.filter(k => !localNames.has(k.name.toLowerCase().trim()));
      const merged = [...localItems, ...kledoUniq];

      const q = search.toLowerCase().trim();
      const filtered = q
        ? merged.filter(s =>
            s.name.toLowerCase().includes(q) ||
            (s.phone ?? '').includes(q) ||
            (s.code ?? '').toLowerCase().includes(q),
          )
        : merged;

      setData(filtered);
      setTotal(filtered.length);
    } catch (e: any) {
      setError(e?.message ?? 'Gagal memuat data supplier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { load(); }, [page]);

  const paginated = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);

  const thStyle: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
  };

  return (
    <ModernLayout>
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Data Supplier
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Manajemen data supplier — lokal & Kledo
            </p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#5D4037', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Supplier
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Supplier', value: total, color: '#5D4037' },
            { label: 'Dari Lokal', value: data.filter(s => s.source === 'local').length, color: '#6366F1' },
            { label: 'Dari Kledo', value: data.filter(s => s.source === 'kledo').length, color: '#0EA5E9' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama / telepon / kode…"
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
            </div>
            <button onClick={load}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total: {total} supplier</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nama Supplier', 'Kode', 'Telepon', 'Email', 'Hutang AP', 'Sumber', 'Status'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} style={{ padding: '12px 14px' }}>
                          <div style={{ height: 12, borderRadius: 6, background: 'var(--surface-sunken)', width: j === 0 ? '60%' : '40%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#EF4444', fontSize: 13 }}>{error}</td></tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 48, textAlign: 'center' }}>
                      <Building2 size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Belum ada supplier terdaftar</p>
                    </td>
                  </tr>
                ) : paginated.map(s => (
                  <tr key={s.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--brand-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: s.source === 'kledo' ? 'rgba(14,165,233,.12)' : 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={14} style={{ color: s.source === 'kledo' ? '#0EA5E9' : '#6366F1' }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.code || '–'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.phone || '–'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.email || '–'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: s.hutang ? 700 : 400, color: s.hutang ? '#EF4444' : 'var(--text-muted)' }}>
                      {s.hutang !== undefined ? IDR(s.hutang) : '–'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                        background: s.source === 'kledo' ? 'rgba(14,165,233,.12)' : 'rgba(99,102,241,.12)',
                        color: s.source === 'kledo' ? '#0EA5E9' : '#6366F1',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        {s.source === 'kledo' ? <Globe size={9} /> : null}
                        {s.source === 'kledo' ? 'Kledo' : 'Lokal'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: s.active ? 'rgba(16,185,129,.12)' : 'rgba(148,163,184,.12)', color: s.active ? '#10B981' : '#94A3B8' }}>
                        {s.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Halaman {page} dari {totalPages}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>←</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', cursor: 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
}
