'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, RefreshCw, Plus, Link2, FileText } from 'lucide-react';

const C      = '#00ACC1';
const PURPLE = '#6366F1';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  draft:    { label: 'Draf',       color: '#94A3B8' },
  sent:     { label: 'Terkirim',   color: '#3B82F6' },
  accepted: { label: 'Diterima',   color: '#22C55E' },
  rejected: { label: 'Ditolak',    color: '#EF4444' },
  expired:  { label: 'Kedaluarsa', color: '#F59E0B' },
};

const fmtRp   = (v: number) => `Rp ${Number(v ?? 0).toLocaleString('id-ID')}`;
const fmtDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

interface QuoteRow {
  id: string;
  quoteNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  validUntil: string;
  createdAt: string;
  items: number;
  source: 'local' | 'kledo';
}

export default function QuotationsPage() {
  const router = useRouter();
  const [rows, setRows]                 = useState<QuoteRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      /* Coba lokal dulu, lalu Kledo quotations */
      const [localRes, kledoRes] = await Promise.allSettled([
        api.get('/quotations?limit=200'),
        api.get('/kledo/quotations', { params: { per_page: 200 } }),
      ]);

      /* Lokal */
      const localRaw: any[] = (() => {
        if (localRes.status !== 'fulfilled') return [];
        const d = localRes.value.data;
        return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      })();
      const localList: QuoteRow[] = localRaw.map(r => ({
        id:           String(r.id),
        quoteNumber:  r.quoteNumber ?? r.noQuote ?? `QUO-${r.id}`,
        customerName: r.customerName ?? r.customer?.name ?? '–',
        totalAmount:  Number(r.totalAmount ?? r.grandTotal ?? 0),
        status:       r.status ?? 'draft',
        validUntil:   r.validUntil ?? r.validDate ?? '',
        createdAt:    r.createdAt ?? r.tanggal ?? '',
        items:        r.items?.length ?? r.itemCount ?? 0,
        source:       'local',
      }));

      /* Kledo */
      const kledoRaw: any[] = (() => {
        if (kledoRes.status !== 'fulfilled') return [];
        const d = kledoRes.value.data;
        const inner = d?.data ?? d;
        return Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [];
      })();
      const localIds = new Set(localList.map(r => r.quoteNumber));

      const kledoList: QuoteRow[] = kledoRaw
        .filter((r: any) => !localIds.has(r.ref_number))
        .map((r: any) => ({
          id:           `kledo-${r.id}`,
          quoteNumber:  r.ref_number ?? r.trans_no ?? `K-${r.id}`,
          customerName: r.contact?.name ?? r.contact_name ?? '–',
          totalAmount:  Number(r.amount ?? r.total ?? 0),
          status:       r.status ?? 'draft',
          validUntil:   r.expired_date ?? r.due_date ?? '',
          createdAt:    r.trans_date ?? '',
          items:        Number(r.items ?? 0),
          source:       'kledo',
        }));

      setRows([...localList, ...kledoList]);
    } catch { setRows([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!search || (r.quoteNumber + (r.customerName ?? '')).toLowerCase().includes(search.toLowerCase()))
  );

  const localCount = rows.filter(r => r.source === 'local').length;
  const kledoCount = rows.filter(r => r.source === 'kledo').length;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Penawaran Harga
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {localCount} lokal + {kledoCount} dari Kledo · total {rows.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: PURPLE, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Penawaran Baru
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',     value: rows.length,                                         color: 'var(--text-primary)' },
          { label: 'Diterima',  value: rows.filter(r => r.status === 'accepted').length,    color: '#22C55E' },
          { label: 'Menunggu',  value: rows.filter(r => r.status === 'sent').length,        color: '#3B82F6' },
          { label: 'Dari Kledo',value: kledoCount,                                          color: PURPLE },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: '5px 0 0' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari no. penawaran / pelanggan…"
            style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)', background: 'var(--surface)' }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Tabel */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                {['No. Penawaran', 'Pelanggan', 'Tanggal', 'Berlaku Hingga', 'Item', 'Total', 'Status', 'Sumber'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <br />Tidak ada penawaran harga
                  </td>
                </tr>
              ) : filtered.map(r => {
                const s = STATUS_CFG[r.status] ?? STATUS_CFG.draft;
                return (
                  <tr key={r.id}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: r.source === 'kledo' ? PURPLE : C, fontSize: 11, fontFamily: 'monospace' }}>{r.quoteNumber}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{r.customerName}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(r.createdAt)}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(r.validUntil)}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{r.items > 0 ? `${r.items} item` : '–'}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{fmtRp(r.totalAmount)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: s.color, background: s.color + '18', border: `1px solid ${s.color}30` }}>
                        {s.label}
                      </span>
                    </td>
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
      </div>
    </>
  );
}
