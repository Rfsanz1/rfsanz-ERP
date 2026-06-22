'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { PURCHASING_CONFIG, PURCHASING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { FileText, Plus, Search, RefreshCw, Globe, AlertCircle } from 'lucide-react';

const IDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '–';
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:        { label: 'Draft',        color: '#78909C' },
  submitted:    { label: 'Dikirim',      color: '#1976D2' },
  approved:     { label: 'Diapprove',    color: '#388E3C' },
  partial_paid: { label: 'Bayar Sebag.', color: '#F57C00' },
  paid:         { label: 'Lunas',        color: '#2E7D32' },
  overdue:      { label: 'Jatuh Tempo',  color: '#C62828' },
  cancelled:    { label: 'Dibatalkan',   color: '#BDBDBD' },
  // Kledo status_id → label
  '1': { label: 'Draft',   color: '#78909C' },
  '2': { label: 'Dikirim', color: '#1976D2' },
  '3': { label: 'Lunas',   color: '#2E7D32' },
  '4': { label: 'Sebagian', color: '#F57C00' },
  '5': { label: 'Dibatalkan', color: '#BDBDBD' },
};

interface BillRow {
  id: string;
  noBill: string;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string | null;
  status: string;
  source: 'local' | 'kledo';
  memo?: string;
  transDate?: string;
}

export default function BillsPage() {
  const router = useRouter();
  const [data, setData]       = useState<BillRow[]>([]);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [kledoCount, setKledoCount] = useState(0);
  const [localCount, setLocalCount] = useState(0);
  const [totalHutang, setTotalHutang] = useState(0);
  const PER_PAGE = 20;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [localRes, kledoRes] = await Promise.allSettled([
        api.get('/purchasing/bills', { params: { search, status, page, limit: PER_PAGE } }),
        api.get('/kledo/purchase-invoices', { params: { per_page: 100, search: search || undefined, status: status || undefined } }),
      ]);

      const localItems: BillRow[] = localRes.status === 'fulfilled'
        ? (localRes.value.data?.data?.data ?? localRes.value.data?.data ?? []).map((b: any) => ({
            id: String(b.id),
            noBill: b.noBill ?? b.no_bill ?? '-',
            supplierName: b.supplier?.name ?? '-',
            totalAmount: Number(b.totalAmount ?? 0),
            paidAmount: Number(b.paidAmount ?? 0),
            dueDate: b.dueDate ?? null,
            status: b.status ?? 'draft',
            source: 'local' as const,
          }))
        : [];

      const kledoRawData = kledoRes.status === 'fulfilled' ? kledoRes.value.data : null;
      const kledoRaw: any[] = Array.isArray(kledoRawData?.data?.data)
        ? kledoRawData.data.data
        : Array.isArray(kledoRawData?.data)
          ? kledoRawData.data
          : [];

      const kledoItems: BillRow[] = kledoRaw.map((k: any) => ({
        id: `kledo-${k.id}`,
        noBill: k.ref_number ?? `PI-${k.id}`,
        supplierName: k.contact?.name ?? '-',
        totalAmount: Number(k.amount_after_tax ?? k.amount ?? 0),
        paidAmount: Number(k.amount_after_tax ?? k.amount ?? 0) - Number(k.due ?? 0),
        dueDate: k.due_date ?? null,
        status: String(k.status_id ?? 'draft'),
        source: 'kledo' as const,
        memo: k.memo ?? '',
        transDate: k.trans_date ?? null,
      }));

      // De-dup: kalau noBill sama, prefer lokal
      const localBillNos = new Set(localItems.map(b => b.noBill));
      const kledoUniq = kledoItems.filter(k => !localBillNos.has(k.noBill));
      const merged = [...localItems, ...kledoUniq];

      const q = search.toLowerCase().trim();
      const filtered = q
        ? merged.filter(b =>
            b.noBill.toLowerCase().includes(q) ||
            b.supplierName.toLowerCase().includes(q) ||
            (b.memo ?? '').toLowerCase().includes(q),
          )
        : merged;

      setData(filtered);
      setTotal(filtered.length);
      setLocalCount(localItems.length);
      setKledoCount(kledoUniq.length);
      setTotalHutang(filtered.reduce((s, b) => s + Math.max(0, b.totalAmount - b.paidAmount), 0));
    } catch (e: any) {
      setError(e?.message ?? 'Gagal memuat data bill');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, status]);

  useEffect(() => { load(); }, [page]);

  const paginated = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);

  const thStyle: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
  };

  return (
    <ModernLayout config={PURCHASING_CONFIG} navItems={PURCHASING_NAV} pageTitle="Vendor Bill (AP)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr) repeat(2, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Bill', value: total.toLocaleString('id-ID'), color: '#5D4037' },
            { label: 'Total Hutang AP', value: IDR(totalHutang), color: '#C62828', small: true },
            { label: 'Dari Lokal DB', value: localCount.toLocaleString('id-ID'), color: '#6366F1' },
            { label: 'Dari Kledo', value: kledoCount.toLocaleString('id-ID'), color: '#0EA5E9' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: s.small ? 16 : 22, fontWeight: 800, color: s.color, margin: 0, lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nomor bill / supplier…"
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface-sunken)', cursor: 'pointer' }}>
            <option value="">Semua Status</option>
            {Object.entries(STATUS_META).filter(([k]) => isNaN(Number(k))).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button onClick={load}
            style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => router.push('/purchasing/bills/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#5D4037', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Buat Bill
          </button>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['No. Bill', 'Supplier', 'Tgl. Transaksi', 'Total', 'Dibayar', 'Outstanding', 'Jatuh Tempo', 'Sumber', 'Status'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} style={{ padding: '12px 14px' }}>
                          <div style={{ height: 12, borderRadius: 6, background: 'var(--surface-sunken)', width: j === 0 ? '60%' : '40%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={9} style={{ padding: 48, textAlign: 'center' }}>
                    <AlertCircle size={32} style={{ color: '#EF4444', margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Belum ada vendor bill
                  </td></tr>
                ) : paginated.map(bill => {
                  const outstanding = Math.max(0, bill.totalAmount - bill.paidAmount);
                  const meta = STATUS_META[bill.status] ?? { label: bill.status, color: '#888' };
                  return (
                    <tr key={bill.id}
                      onClick={() => bill.source === 'local' && router.push(`/purchasing/bills/${bill.id}`)}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s', cursor: bill.source === 'local' ? 'pointer' : 'default' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                      <td style={{ padding: '11px 14px', fontWeight: 700, fontSize: 12, color: '#5D4037', fontFamily: 'monospace' }}>{bill.noBill}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13 }}>{bill.supplierName}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(bill.transDate)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13 }}>{IDR(bill.totalAmount)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: '#388E3C' }}>{IDR(bill.paidAmount)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: outstanding > 0 ? '#C62828' : '#388E3C' }}>{IDR(outstanding)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(bill.dueDate)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: bill.source === 'kledo' ? 'rgba(14,165,233,.12)' : 'rgba(99,102,241,.12)', color: bill.source === 'kledo' ? '#0EA5E9' : '#6366F1', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {bill.source === 'kledo' && <Globe size={9} />}
                          {bill.source === 'kledo' ? 'Kledo' : 'Lokal'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: meta.color, background: meta.color + '22' }}>{meta.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Halaman {page} dari {totalPages} — Total {total} bill</span>
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
