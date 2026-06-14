'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, RefreshCw, AlertTriangle, Link2, Plus } from 'lucide-react';

const C      = '#00ACC1';
const PURPLE = '#6366F1';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  paid:      { label: 'Lunas',        color: '#22C55E' },
  unpaid:    { label: 'Belum Bayar',  color: '#EF4444' },
  partial:   { label: 'Sebagian',     color: '#F59E0B' },
  overdue:   { label: 'Jatuh Tempo',  color: '#DC2626' },
  draft:     { label: 'Draft',        color: '#9CA3AF' },
  sent:      { label: 'Terkirim',     color: '#3B82F6' },
  cancelled: { label: 'Dibatalkan',   color: '#6B7280' },
};

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#9CA3AF' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: cfg.color, background: cfg.color + '1A', border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

interface FakturRow {
  id: string;
  number: string;
  customerName: string;
  totalAmount: number;
  amountDue: number;
  status: string;
  dueDate: string;
  createdAt: string;
  source: 'local' | 'kledo';
  kledoId?: string | number;
}

export default function FakturPage() {
  const router  = useRouter();
  const [rows, setRows]                 = useState<FakturRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [source, setSource]             = useState<'merged' | 'local' | 'kledo'>('merged');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      /* Ambil dari lokal + Kledo secara paralel */
      const [localRes, kledoRes] = await Promise.allSettled([
        api.get('/invoices?limit=200'),
        api.get('/kledo/invoices', { params: { per_page: 200 } }),
      ]);

      /* Lokal */
      const localRaw: any[] = (() => {
        if (localRes.status !== 'fulfilled') return [];
        const d = localRes.value.data;
        return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      })();
      const localList: FakturRow[] = localRaw.map(r => ({
        id:           String(r.id),
        number:       r.noInvoice ?? r.invoiceNumber ?? `INV-${r.id}`,
        customerName: r.customer?.name ?? r.customerName ?? '–',
        totalAmount:  Number(r.grandTotal ?? r.totalAmount ?? 0),
        amountDue:    Number(r.grandTotal ?? 0) - Number(r.paidAmount ?? 0),
        status:       r.status ?? 'draft',
        dueDate:      r.dueDate ?? '',
        createdAt:    r.tanggal ?? r.createdAt ?? '',
        source:       'local',
        kledoId:      r.kledoInvoiceId ?? undefined,
      }));

      /* Kledo */
      const kledoRaw: any[] = (() => {
        if (kledoRes.status !== 'fulfilled') return [];
        const d = kledoRes.value.data;
        const inner = d?.data ?? d;
        return Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [];
      })();
      const localKledoIds = new Set(localList.map(r => String(r.kledoId)).filter(Boolean));

      const kledoList: FakturRow[] = kledoRaw
        .filter((r: any) => !localKledoIds.has(String(r.id)))
        .map((r: any) => ({
          id:           `kledo-${r.id}`,
          number:       r.ref_number ?? r.trans_no ?? `K-${r.id}`,
          customerName: r.contact?.name ?? r.contact_name ?? '–',
          totalAmount:  Number(r.amount ?? r.total ?? 0),
          amountDue:    Number(r.amount_due ?? r.remaining ?? 0),
          status:       r.status ?? 'draft',
          dueDate:      r.due_date ?? '',
          createdAt:    r.trans_date ?? '',
          source:       'kledo',
          kledoId:      r.id,
        }));

      const merged = [...localList, ...kledoList];
      setRows(merged);
      setSource(merged.length > 0 ? 'merged' : 'local');
    } catch { setRows([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!search || (r.number + (r.customerName ?? '')).toLowerCase().includes(search.toLowerCase()))
  );

  const fmtRp   = (v: number) => `Rp ${Number(v ?? 0).toLocaleString('id-ID')}`;
  const fmtDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

  const totalOutstanding  = filtered.reduce((s, r) => s + (r.amountDue > 0 ? r.amountDue : 0), 0);
  const overdueCount      = filtered.filter(r => r.status === 'overdue' || (r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'paid')).length;
  const localCount        = rows.filter(r => r.source === 'local').length;
  const kledoCount        = rows.filter(r => r.source === 'kledo').length;

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Faktur / Invoice</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {localCount} lokal + {kledoCount} dari Kledo · total {rows.length}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => router.push('/sales/invoices/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: C, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Invoice Baru
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Piutang',       value: fmtRp(totalOutstanding),                                       color: '#EF4444', bg: 'rgba(239,68,68,.07)'  },
          { label: 'Jatuh Tempo',         value: `${overdueCount} invoice`,                                     color: '#DC2626', bg: 'rgba(220,38,38,.07)'  },
          { label: 'Lunas',               value: `${filtered.filter(r => r.status === 'paid').length} invoice`,  color: '#22C55E', bg: 'rgba(34,197,94,.07)'  },
          { label: 'Belum Bayar',         value: `${filtered.filter(r => r.status === 'unpaid' || r.status === 'draft').length} invoice`, color: '#F59E0B', bg: 'rgba(245,158,11,.07)' },
          { label: 'Dari Kledo',          value: `${kledoCount} invoice`,                                        color: PURPLE,    bg: `${PURPLE}0D`          },
        ].map(card => (
          <div key={card.label} style={{ borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${card.color}25`, background: card.bg }}>
            <p style={{ fontSize: 10, color: card.color, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: '.04em' }}>{card.label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: card.color, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Alert jatuh tempo */}
      {overdueCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(239,68,68,.07)', border: '1.5px solid rgba(239,68,68,.2)', marginBottom: 16 }}>
          <AlertTriangle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600, margin: 0 }}>
            {overdueCount} invoice sudah melewati jatuh tempo — segera lakukan penagihan.
          </p>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari no. invoice / pelanggan…"
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)', background: 'var(--surface-sunken)' }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Tabel */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                {['No. Invoice', 'Pelanggan', 'Tanggal', 'Jatuh Tempo', 'Total', 'Sisa Bayar', 'Status', 'Sumber'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data dari Kledo…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada invoice ditemukan</td></tr>
              ) : filtered.map(r => {
                const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'paid';
                return (
                  <tr key={r.id}
                    onClick={() => r.source === 'local' ? router.push(`/sales/invoices/${r.id}`) : undefined}
                    style={{ borderBottom: '1px solid var(--border)', cursor: r.source === 'local' ? 'pointer' : 'default', background: isOverdue ? 'rgba(239,68,68,.03)' : 'transparent', transition: 'background .12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = isOverdue ? 'rgba(239,68,68,.07)' : 'var(--brand-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isOverdue ? 'rgba(239,68,68,.03)' : 'transparent')}>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: r.source === 'kledo' ? PURPLE : C, fontSize: 11, fontFamily: 'monospace' }}>{r.number}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{r.customerName}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(r.createdAt)}</td>
                    <td style={{ padding: '13px 16px', color: isOverdue ? '#DC2626' : 'var(--text-muted)', fontSize: 12, fontWeight: isOverdue ? 700 : 400 }}>{fmtDate(r.dueDate)}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{fmtRp(r.totalAmount)}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: r.amountDue > 0 ? '#EF4444' : '#22C55E' }}>{fmtRp(Math.max(0, r.amountDue))}</td>
                    <td style={{ padding: '13px 16px' }}><Badge status={r.status} /></td>
                    <td style={{ padding: '13px 16px' }}>
                      {r.source === 'kledo' ? (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: PURPLE, background: PURPLE + '12', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Link2 size={8} /> Kledo
                        </span>
                      ) : (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: C, background: C + '12' }}>ERP</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12 }}>
            {filtered.length} invoice · Total piutang: <strong style={{ color: '#EF4444' }}>{fmtRp(totalOutstanding)}</strong>
          </div>
        )}
      </div>
    </>
  );
}
