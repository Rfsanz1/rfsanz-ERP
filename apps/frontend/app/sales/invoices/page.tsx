'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import {
  Plus, Search, RefreshCw, FileText, Link2,
  CheckCircle2, AlertCircle, MessageSquare, Send,
} from 'lucide-react';

const C = '#00ACC1';
const fmtRp   = (v: number) => `Rp ${Number(v ?? 0).toLocaleString('id-ID')}`;
const fmtDate = (v: string) => v
  ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '–';

function KledoBadge({ synced, invoiceId }: { synced: boolean; invoiceId?: string | null }) {
  if (synced) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ color: '#059669', background: 'rgba(5,150,105,.12)', border: '1px solid rgba(5,150,105,.25)' }}>
      <CheckCircle2 className="h-2.5 w-2.5" /> Kledo {invoiceId ? `#${invoiceId}` : '✓'}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ color: '#D97706', background: 'rgba(217,119,6,.1)', border: '1px solid rgba(217,119,6,.25)' }}>
      <AlertCircle className="h-2.5 w-2.5" /> Belum sync Kledo
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending:   ['Pending',    '#F59E0B'],
    confirmed: ['Lunas',      '#22C55E'],
    cancelled: ['Dibatalkan', '#EF4444'],
    draft:     ['Draf',       '#94A3B8'],
    paid:      ['Lunas',      '#22C55E'],
  };
  const [label, color] = map[status] ?? [status, '#94A3B8'];
  return (
    <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ color, background: color + '1A', border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 rounded-2xl" style={{ background: 'var(--border)' }} />
      ))}
    </div>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const [rows, setRows]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState({ total: 0, pages: 1 });
  const [error, setError]     = useState('');

  const [resyncId, setResyncId]   = useState<number | null>(null);
  const [resyncMsg, setResyncMsg] = useState<Record<number, string>>({});
  const [waId, setWaId]           = useState<number | null>(null);
  const [waMsg, setWaMsg]         = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (search) params.set('search', search);
      const res  = await fetch(`/api/sales/invoices?${params}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setRows(json.data ?? []);
      setMeta(json.meta ?? { total: 0, pages: 1 });
    } catch (e: any) {
      setError(e.message ?? 'Gagal memuat data');
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const resync = async (row: any) => {
    setResyncId(row.id);
    setResyncMsg(m => ({ ...m, [row.id]: 'Mengirim ke Kledo…' }));
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('gm_auth_token') ?? '' : '';
      const res  = await fetch('/api/sales/invoices/resync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: row.id }),
      });
      const json = await res.json();
      if (json.ok) {
        setResyncMsg(m => ({ ...m, [row.id]: '✓ Berhasil sync ke Kledo' }));
        load();
      } else {
        setResyncMsg(m => ({ ...m, [row.id]: `✗ ${json.error ?? 'Gagal'}` }));
      }
    } catch (e: any) {
      setResyncMsg(m => ({ ...m, [row.id]: `✗ ${e.message}` }));
    }
    setResyncId(null);
  };

  const kirimWa = async (row: any) => {
    setWaId(row.id);
    setWaMsg(m => ({ ...m, [row.id]: 'Mengirim WA…' }));
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('gm_auth_token') ?? '' : '';
      const res  = await fetch('/api/sales/invoices/send-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: row.id }),
      });
      const json = await res.json();
      if (json.ok) {
        setWaMsg(m => ({ ...m, [row.id]: '✓ WA terkirim' }));
      } else {
        setWaMsg(m => ({ ...m, [row.id]: `✗ ${json.error ?? 'Gagal'}` }));
      }
    } catch (e: any) {
      setWaMsg(m => ({ ...m, [row.id]: `✗ ${e.message}` }));
    }
    setWaId(null);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText className="h-5 w-5" style={{ color: C }} />
              Invoice
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {meta.total} invoice • tersinkron otomatis ke Kledo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading}
              className="p-2.5 rounded-xl"
              style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => router.push('/sales/invoices/new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C}, #0097A7)` }}>
              <Plus className="h-4 w-4" /> Buat Invoice
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
            placeholder="Cari nomor invoice, nama pelanggan, atau sales…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl p-3 text-sm flex items-center gap-2"
            style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1.5px solid rgba(239,68,68,.25)' }}>
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* List */}
        {loading ? <Skeleton /> : rows.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <FileText className="h-12 w-12 mx-auto opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {search ? 'Tidak ada invoice yang cocok' : 'Belum ada invoice'}
            </p>
            {!search && (
              <button onClick={() => router.push('/sales/invoices/new')}
                className="mx-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${C}, #0097A7)` }}>
                <Plus className="h-4 w-4" /> Buat Invoice Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(row => (
              <div key={row.id} className="rounded-2xl p-4"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>

                {/* Baris utama */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold font-mono" style={{ color: C }}>{row.so_number}</span>
                      <StatusBadge status={row.status} />
                      <KledoBadge synced={row.kledo_synced} invoiceId={row.kledo_invoice_id} />
                    </div>
                    <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{row.nama_customer}</p>
                    <p className="text-xs mt-0.5 space-x-2" style={{ color: 'var(--text-muted)' }}>
                      <span>{fmtDate(row.tanggal)}</span>
                      {row.no_hp    && <span>· WA: {row.no_hp}</span>}
                      {row.sales_name && <span>· Sales: {row.sales_name}</span>}
                      {row.metode_pembayaran && <span>· {row.metode_pembayaran}</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold" style={{ color: C }}>{fmtRp(row.total_harga)}</p>
                    {Array.isArray(row.items) && (
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{row.items.length} item</p>
                    )}
                  </div>
                </div>

                {/* Produk */}
                {Array.isArray(row.items) && row.items.length > 0 && (
                  <div className="mt-3 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5"
                    style={{ borderTop: '1px dashed var(--border)' }}>
                    {row.items.map((it: any) => (
                      <div key={it.id} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--surface-sunken)' }}>
                        <span className="font-medium truncate mr-2" style={{ color: 'var(--text-primary)' }}>{it.nama}</span>
                        <span className="flex-shrink-0 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          {it.qty}× {fmtRp(it.harga)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pesan feedback */}
                {(resyncMsg[row.id] || waMsg[row.id]) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {resyncMsg[row.id] && (
                      <p className="text-[11px] px-2.5 py-1 rounded-lg font-medium"
                        style={{
                          color: resyncMsg[row.id].startsWith('✓') ? '#059669' : resyncMsg[row.id].startsWith('✗') ? '#DC2626' : C,
                          background: resyncMsg[row.id].startsWith('✓') ? 'rgba(5,150,105,.08)' : resyncMsg[row.id].startsWith('✗') ? 'rgba(220,38,38,.08)' : `${C}10`,
                        }}>
                        {resyncMsg[row.id]}
                      </p>
                    )}
                    {waMsg[row.id] && (
                      <p className="text-[11px] px-2.5 py-1 rounded-lg font-medium"
                        style={{
                          color: waMsg[row.id].startsWith('✓') ? '#059669' : waMsg[row.id].startsWith('✗') ? '#DC2626' : '#25D366',
                          background: waMsg[row.id].startsWith('✓') ? 'rgba(5,150,105,.08)' : waMsg[row.id].startsWith('✗') ? 'rgba(220,38,38,.08)' : 'rgba(37,211,102,.08)',
                        }}>
                        {waMsg[row.id]}
                      </p>
                    )}
                  </div>
                )}

                {/* Tombol aksi */}
                <div className="mt-3 pt-3 flex items-center gap-2 flex-wrap"
                  style={{ borderTop: '1px solid var(--border)' }}>

                  {!row.kledo_synced && (
                    <button onClick={() => resync(row)} disabled={resyncId === row.id}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                      style={{ color: '#D97706', background: 'rgba(217,119,6,.1)', border: '1px solid rgba(217,119,6,.25)' }}>
                      {resyncId === row.id
                        ? <><div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: '#D9770640', borderTopColor: '#D97706' }} /> Mengirim…</>
                        : <><Link2 className="h-3 w-3" /> Sync ke Kledo</>}
                    </button>
                  )}

                  <button onClick={() => kirimWa(row)} disabled={waId === row.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                    style={{ color: '#15803D', background: 'rgba(37,211,102,.08)', border: '1px solid rgba(37,211,102,.2)' }}>
                    {waId === row.id
                      ? <><div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: '#25D36640', borderTopColor: '#25D366' }} /> Mengirim…</>
                      : <><Send className="h-3 w-3" /> {row.no_hp ? 'Kirim Ulang WA' : 'Kirim ke Grup WA'}</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
              ← Prev
            </button>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {page} / {meta.pages}
            </span>
            <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page >= meta.pages}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
