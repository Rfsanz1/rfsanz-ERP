'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../lib/nav-configs';
import { api } from '../../lib/api';
import { CheckCircle, XCircle, Clock, RefreshCw, ShoppingCart, Receipt } from 'lucide-react';

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function ApprovalPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  const [tab, setTab]             = useState<'purchase_order' | 'expense'>('purchase_order');
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(false);
  const [notes, setNotes]         = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);


  const fetchData = async () => {
    setLoading(true);
    try { const res = await api.get('/workflow/pending'); setData(res.data); }
    catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const handleApprove = async (module: string, referenceId: string) => {
    setProcessing(referenceId);
    try { await api.post('/workflow/approve', { module, referenceId, notes: notes[referenceId] }); fetchData(); }
    catch { alert('Gagal approve'); }
    finally { setProcessing(null); }
  };

  const handleReject = async (module: string, referenceId: string) => {
    if (!notes[referenceId]) { alert('Isi alasan penolakan terlebih dahulu'); return; }
    setProcessing(referenceId);
    try { await api.post('/workflow/reject', { module, referenceId, notes: notes[referenceId] }); fetchData(); }
    catch { alert('Gagal reject'); }
    finally { setProcessing(null); }
  };

  if (!token) return null;

  const poItems      = data?.purchaseOrders ?? [];
  const expItems     = data?.expenses ?? [];
  const total        = data?.total ?? 0;
  const currentItems = tab === 'purchase_order' ? poItems : expItems;

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/approval">
      <div style={{ maxWidth: 800 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Approval Workflow</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Dokumen yang menunggu persetujuan Anda</p>
          </div>
          <div className="flex items-center gap-2">
            {total > 0 && (
              <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 100, background: '#EF4444', color: '#fff' }}>{total} Pending</span>
            )}
            <button onClick={fetchData} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', width: 'fit-content' }}>
          {([
            ['purchase_order', 'Purchase Order', ShoppingCart, poItems.length],
            ['expense',        'Pengeluaran',    Receipt,      expItems.length],
          ] as const).map(([key, label, Icon, count]) => (
            <button key={key} onClick={() => setTab(key as any)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s',
                background: tab === key ? '#6366F1' : 'transparent',
                color: tab === key ? '#fff' : 'var(--text-muted)' }}>
              <Icon size={14} /> {label}
              {count > 0 && (
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 100,
                  background: tab === key ? 'rgba(255,255,255,.3)' : '#EF4444', color: '#fff' }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data…</div>
        ) : currentItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <CheckCircle size={40} style={{ color: '#10B981', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, margin: '0 0 4px' }}>Tidak ada yang perlu di-approve</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Semua dokumen sudah diproses</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentItems.map((item: any) => (
              <div key={item.id} style={{ background: 'var(--surface)', borderRadius: 14, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
                  <div>
                    <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{item.number}</span>
                      <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(245,158,11,0.10)', color: '#92400E' }}>
                        <Clock size={10} /> Menunggu
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 2px' }}>
                      {tab === 'purchase_order' ? item.supplier : item.description}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{new Date(item.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 3px' }}>Nominal</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{fmt(item.amount)}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Catatan (opsional untuk approve, wajib untuk reject)…"
                    value={notes[item.id] ?? ''}
                    onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                    onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                  <button onClick={() => handleApprove(item.module, item.id)} disabled={processing === item.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: processing === item.id ? 0.7 : 1 }}>
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button onClick={() => handleReject(item.module, item.id)} disabled={processing === item.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: processing === item.id ? 0.7 : 1 }}>
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
