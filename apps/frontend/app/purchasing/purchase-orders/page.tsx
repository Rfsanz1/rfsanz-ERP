'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { Truck, Plus, Search, RefreshCw, CheckCircle, DollarSign, Package, FileText, Globe, AlertCircle } from 'lucide-react';

const STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draf',       color: '#94A3B8' },
  approved:  { label: 'Disetujui',  color: '#10B981' },
  received:  { label: 'Diterima',   color: '#3B82F6' },
  cancelled: { label: 'Dibatalkan', color: '#EF4444' },
  partial:   { label: 'Sebagian',   color: '#F59E0B' },
  '1': { label: 'Draf',      color: '#94A3B8' },
  '2': { label: 'Dikirim',   color: '#3B82F6' },
  '3': { label: 'Lunas',     color: '#10B981' },
  '4': { label: 'Sebagian',  color: '#F59E0B' },
  '5': { label: 'Batal',     color: '#EF4444' },
};

const IDR = (n: number) => Number(n || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const fmtDate = (d: string | null | undefined) => {
  if (!d) return '–';
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d); }
};

interface PORow {
  id: string;
  noPo: string;
  supplierName: string;
  tanggal: string | null;
  totalHarga: number;
  status: string;
  source: 'local' | 'kledo';
  memo?: string;
  dueDate?: string | null;
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};
const card: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 16,
  border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [data, setData]       = useState<PORow[]>([]);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [totalNilai, setTotalNilai] = useState(0);
  const [kledoCount, setKledoCount] = useState(0);
  const [localCount, setLocalCount] = useState(0);
  const PER_PAGE = 20;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [localRes, kledoRes] = await Promise.allSettled([
        api.get('/purchasing/purchase-orders', { params: { search, status, page, limit: PER_PAGE } }),
        api.get('/kledo/purchase-invoices', { params: { per_page: 100, search: search || undefined } }),
      ]);

      const localItems: PORow[] = localRes.status === 'fulfilled'
        ? (localRes.value.data?.data?.data ?? localRes.value.data?.data ?? []).map((po: any) => ({
            id: String(po.id),
            noPo: po.noPo ?? po.no_po ?? '-',
            supplierName: po.supplier?.name ?? '-',
            tanggal: po.tanggal ?? po.createdAt ?? null,
            totalHarga: Number(po.totalHarga ?? 0),
            status: po.status ?? 'draft',
            source: 'local' as const,
          }))
        : [];

      const kledoRawData = kledoRes.status === 'fulfilled' ? kledoRes.value.data : null;
      const kledoRaw: any[] = Array.isArray(kledoRawData?.data?.data)
        ? kledoRawData.data.data
        : Array.isArray(kledoRawData?.data)
          ? kledoRawData.data
          : [];

      const kledoItems: PORow[] = kledoRaw.map((k: any) => ({
        id: `kledo-${k.id}`,
        noPo: k.ref_number ?? `PI-${k.id}`,
        supplierName: k.contact?.name ?? '-',
        tanggal: k.trans_date ?? null,
        totalHarga: Number(k.amount_after_tax ?? k.amount ?? 0),
        status: String(k.status_id ?? '1'),
        source: 'kledo' as const,
        memo: k.memo ?? '',
        dueDate: k.due_date ?? null,
      }));

      const localNos = new Set(localItems.map(p => p.noPo));
      const kledoUniq = kledoItems.filter(k => !localNos.has(k.noPo));
      const merged = [...localItems, ...kledoUniq];

      const q = search.toLowerCase().trim();
      const filtered = q
        ? merged.filter(p =>
            p.noPo.toLowerCase().includes(q) ||
            p.supplierName.toLowerCase().includes(q),
          )
        : merged;

      const statusFiltered = status && isNaN(Number(status))
        ? filtered.filter(p => p.status === status || p.status === STATUS[status]?.label)
        : filtered;

      setData(statusFiltered);
      setTotal(statusFiltered.length);
      setLocalCount(localItems.length);
      setKledoCount(kledoUniq.length);
      setTotalNilai(statusFiltered.reduce((s, p) => s + p.totalHarga, 0));
    } catch (e: any) {
      setError(e?.message ?? 'Gagal memuat data PO');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, status]);

  useEffect(() => { load(); }, [page]);

  const approve = async (id: string) => {
    try { await api.post(`/purchasing/purchase-orders/${id}/approve`); load(); }
    catch (e: any) { alert(e.response?.data?.message || 'Gagal menyetujui PO'); }
  };

  const paginated = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <ModernLayout>
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Purchase Order</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Manajemen pembelian — lokal &amp; Kledo</p>
          </div>
          <button onClick={() => router.push('/purchasing/purchase-orders/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Buat PO
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Total PO', value: total.toLocaleString('id-ID'), icon: FileText, accent: '#6366F1' },
            { label: 'Total Nilai', value: IDR(totalNilai), icon: DollarSign, accent: '#F59E0B', small: true },
            { label: 'Dari Lokal DB', value: localCount.toLocaleString('id-ID'), icon: Package, accent: '#94A3B8' },
            { label: 'Dari Kledo', value: kledoCount.toLocaleString('id-ID'), icon: Globe, accent: '#0EA5E9' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={card}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.accent + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={16} style={{ color: s.accent }} strokeWidth={2} />
                </div>
                <p style={{ fontSize: s.small ? 15 : 22, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '5px 0 0' }}>{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                placeholder="Cari nomor PO / supplier…" />
            </div>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface-sunken)', cursor: 'pointer' }}>
              <option value="">Semua Status</option>
              {['draft','approved','received','cancelled'].map(k => (
                <option key={k} value={k}>{STATUS[k]?.label ?? k}</option>
              ))}
            </select>
            <button onClick={load}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>No. PO</th>
                  <th style={thStyle}>Supplier</th>
                  <th style={thStyle}>Tanggal</th>
                  <th style={thStyle}>Jatuh Tempo</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Sumber</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} style={{ padding: '13px 16px' }}>
                          <div style={{ height: 12, borderRadius: 6, background: 'var(--surface-sunken)', width: j === 0 ? '60%' : '40%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center' }}>
                    <AlertCircle size={32} style={{ color: '#EF4444', margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada Purchase Order</td></tr>
                ) : paginated.map(po => {
                  const st = STATUS[po.status] ?? { label: po.status, color: '#94A3B8' };
                  return (
                    <tr key={po.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                      <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#6366F1' }}>{po.noPo}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{po.supplierName}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(po.tanggal)}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(po.dueDate)}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{IDR(po.totalHarga)}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: po.source === 'kledo' ? 'rgba(14,165,233,.12)' : 'rgba(99,102,241,.12)', color: po.source === 'kledo' ? '#0EA5E9' : '#6366F1', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {po.source === 'kledo' && <Globe size={9} />}
                          {po.source === 'kledo' ? 'Kledo' : 'Lokal'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: st.color, background: st.color + '1A' }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        {po.source === 'local' && po.status === 'draft' && (
                          <button onClick={() => approve(po.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            <CheckCircle size={12} /> Setujui
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Total: {total} PO (Hal {page}{totalPages > 1 ? ` / ${totalPages}` : ''})</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>←</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>→</button>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
