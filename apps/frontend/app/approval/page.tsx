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
  const router = useRouter();
  const [tab, setTab] = useState<'purchase_order' | 'expense'>('purchase_order');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { if (!token) router.push('/login'); }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workflow/pending');
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const handleApprove = async (module: string, referenceId: string) => {
    setProcessing(referenceId);
    try {
      await api.post('/workflow/approve', { module, referenceId, notes: notes[referenceId] });
      fetchData();
    } catch { alert('Gagal approve'); }
    finally { setProcessing(null); }
  };

  const handleReject = async (module: string, referenceId: string) => {
    if (!notes[referenceId]) { alert('Isi alasan penolakan terlebih dahulu'); return; }
    setProcessing(referenceId);
    try {
      await api.post('/workflow/reject', { module, referenceId, notes: notes[referenceId] });
      fetchData();
    } catch { alert('Gagal reject'); }
    finally { setProcessing(null); }
  };

  if (!token) return null;

  const poItems = data?.purchaseOrders ?? [];
  const expItems = data?.expenses ?? [];
  const total = (data?.total ?? 0);
  const currentItems = tab === 'purchase_order' ? poItems : expItems;

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/approval">
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Approval Workflow</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Dokumen yang menunggu persetujuan Anda</p>
          </div>
          <div className="flex items-center gap-2">
            {total > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: '#EA5455' }}>{total} Pending</span>
            )}
            <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg" style={{ border: '1.5px solid #EDE8F5' }}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#F3F0FF' }}>
          {[
            ['purchase_order', 'Purchase Order', ShoppingCart, poItems.length],
            ['expense', 'Pengeluaran', Receipt, expItems.length],
          ].map(([key, label, Icon, count]: any) => (
            <button key={key} onClick={() => setTab(key)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all" style={{
              background: tab === key ? '#7367F0' : 'transparent',
              color: tab === key ? '#fff' : '#6B7280',
            }}>
              <Icon className="h-4 w-4" /> {label}
              {count > 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full ml-1" style={{ background: tab === key ? 'rgba(255,255,255,.3)' : '#EA5455', color: '#fff' }}>{count}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5' }}>
            <CheckCircle className="h-10 w-10 mx-auto mb-3" style={{ color: '#4CAF50' }} />
            <p className="font-semibold" style={{ color: '#1E1B4B' }}>Tidak ada yang perlu di-approve</p>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Semua dokumen sudah diproses</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentItems.map((item: any) => (
              <div key={item.id} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: '#1E1B4B' }}>{item.number}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,152,0,.1)', color: '#E65100' }}>
                        <Clock className="inline h-3 w-3 mr-1" />Menunggu
                      </span>
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
                      {tab === 'purchase_order' ? item.supplier : item.description}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{new Date(item.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Nominal</p>
                    <p className="text-base font-bold" style={{ color: '#1E1B4B' }}>{fmt(item.amount)}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Catatan (opsional untuk approve, wajib untuk reject)..."
                    value={notes[item.id] ?? ''}
                    onChange={(e) => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                    className="flex-1 text-sm border rounded-lg px-3 py-2"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                  <button
                    onClick={() => handleApprove(item.module, item.id)}
                    disabled={processing === item.id}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white"
                    style={{ background: '#4CAF50' }}
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(item.module, item.id)}
                    disabled={processing === item.id}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white"
                    style={{ background: '#EA5455' }}
                  >
                    <XCircle className="h-4 w-4" /> Reject
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
