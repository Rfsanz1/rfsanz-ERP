'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ModernLayout } from '../../../../components/layout/ModernLayout';
import { PURCHASING_CONFIG, PURCHASING_NAV } from '../../../../lib/nav-configs';
import { api } from '../../../../lib/api';
import { ArrowLeft, CheckCircle, GitMerge, DollarSign, FileText, AlertTriangle } from 'lucide-react';

const IDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:        { label: 'Draft',              color: '#78909C' },
  submitted:    { label: 'Dikirim',            color: '#1976D2' },
  approved:     { label: 'Diapprove',          color: '#388E3C' },
  partial_paid: { label: 'Bayar Sebagian',     color: '#F57C00' },
  paid:         { label: 'Lunas',              color: '#2E7D32' },
  overdue:      { label: 'Jatuh Tempo',        color: '#C62828' },
  cancelled:    { label: 'Dibatalkan',         color: '#BDBDBD' },
};

export default function BillDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [bill, setBill]         = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [match, setMatch]       = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'payments' | 'match'>('info');
  const [loading, setLoading]   = useState(true);
  const [payForm, setPayForm]   = useState({ amount: '', method: 'transfer', referensi: '', notes: '' });
  const [paying, setPaying]     = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [b, p] = await Promise.all([
        api.get(`/purchasing/bills/${id}`),
        api.get(`/purchasing/bills/${id}/payments`),
      ]);
      setBill(b.data.data ?? b.data);
      setPayments(p.data.data ?? []);
    } catch { } finally { setLoading(false); }
  };

  const loadMatch = async () => {
    try {
      const r = await api.get(`/purchasing/bills/${id}/three-way-match`);
      setMatch(r.data.data ?? r.data);
    } catch { }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (activeTab === 'match' && !match) loadMatch(); }, [activeTab]);

  const doAction = async (action: string) => {
    setActionLoading(action);
    try {
      if (action === 'approve') await api.post(`/purchasing/bills/${id}/approve`);
      await load();
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Gagal'); }
    finally { setActionLoading(''); }
  };

  const submitPayment = async () => {
    if (!payForm.amount || Number(payForm.amount) <= 0) return alert('Jumlah pembayaran harus > 0');
    setPaying(true);
    try {
      await api.post(`/purchasing/bills/${id}/payments`, payForm);
      setPayForm({ amount: '', method: 'transfer', referensi: '', notes: '' });
      await load();
      const p = await api.get(`/purchasing/bills/${id}/payments`);
      setPayments(p.data.data ?? []);
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Gagal catat pembayaran'); }
    finally { setPaying(false); }
  };

  if (loading) return <ModernLayout config={PURCHASING_CONFIG} navItems={PURCHASING_NAV} pageTitle="Detail Bill"><div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Memuat…</div></ModernLayout>;
  if (!bill) return <ModernLayout config={PURCHASING_CONFIG} navItems={PURCHASING_NAV} pageTitle="Detail Bill"><div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Bill tidak ditemukan</div></ModernLayout>;

  const meta = STATUS_META[bill.status] ?? { label: bill.status, color: '#888' };
  const outstanding = Number(bill.totalAmount) - Number(bill.paidAmount ?? 0);

  return (
    <ModernLayout config={PURCHASING_CONFIG} navItems={PURCHASING_NAV} pageTitle="Detail Vendor Bill">
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.back()} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <ArrowLeft size={14} /> Kembali
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#5D4037' }}>{bill.noBill}</h2>
              <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: meta.color + '22', color: meta.color }}>{meta.label}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['draft','submitted'].includes(bill.status) && (
              <button onClick={() => doAction('approve')} disabled={actionLoading === 'approve'} style={{ padding: '7px 14px', borderRadius: 7, background: '#388E3C', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> Approve
              </button>
            )}
            <button onClick={() => window.open(`/api/purchasing/bills/${id}/pdf`, '_blank')} style={{ padding: '7px 14px', borderRadius: 7, background: '#5D4037', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} /> PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Total Tagihan', value: IDR(Number(bill.totalAmount)), color: '#5D4037' },
            { label: 'Sudah Dibayar', value: IDR(Number(bill.paidAmount ?? 0)), color: '#388E3C' },
            { label: 'Sisa Hutang',   value: IDR(outstanding), color: outstanding > 0 ? '#C62828' : '#388E3C' },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #F3F3F3' }}>
          {[{ key: 'info', label: 'Info Bill' }, { key: 'payments', label: 'Pembayaran' }, { key: 'match', label: '3-Way Match' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 400, color: activeTab === t.key ? '#5D4037' : '#888', borderBottom: activeTab === t.key ? '2px solid #5D4037' : '2px solid transparent', marginBottom: -2 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Info */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div style={{ fontWeight: 700, color: '#5D4037', marginBottom: 14 }}>Informasi</div>
              {[
                { label: 'No. Bill',     value: bill.noBill },
                { label: 'Supplier',     value: bill.supplier?.name ?? '-' },
                { label: 'Jatuh Tempo', value: bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('id-ID') : '-' },
                { label: 'Dibuat',       value: new Date(bill.createdAt).toLocaleDateString('id-ID') },
                { label: 'Catatan',      value: bill.note || '-' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F5F5', fontSize: 13 }}>
                  <span style={{ color: '#888' }}>{row.label}</span>
                  <span style={{ fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F3F3', fontWeight: 700, color: '#5D4037', fontSize: 14 }}>Item ({bill.items?.length ?? 0})</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#F9F5F0' }}>{['Produk','Qty','Harga','Subtotal'].map(h => <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, color: '#5D4037', fontWeight: 700 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {(bill.items ?? []).map((it: any, i: number) => (
                    <tr key={i} style={{ borderTop: '1px solid #F3F3F3' }}>
                      <td style={{ padding: '7px 12px', fontSize: 12 }}>{it.nama}</td>
                      <td style={{ padding: '7px 12px', fontSize: 12 }}>{it.qty}</td>
                      <td style={{ padding: '7px 12px', fontSize: 12 }}>{IDR(Number(it.unitPrice))}</td>
                      <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600 }}>{IDR(Number(it.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Payments */}
        {activeTab === 'payments' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Catat Pembayaran */}
            <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div style={{ fontWeight: 700, color: '#5D4037', marginBottom: 16 }}>Catat Pembayaran</div>
              {[
                { label: 'Jumlah *', type: 'number', key: 'amount', placeholder: '0' },
                { label: 'Referensi', type: 'text', key: 'referensi', placeholder: 'No. transfer / cek' },
                { label: 'Catatan', type: 'text', key: 'notes', placeholder: '' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#5D4037', display: 'block', marginBottom: 5 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(payForm as any)[f.key]} onChange={e => setPayForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #E0E0E0', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#5D4037', display: 'block', marginBottom: 5 }}>Metode</label>
                <select value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))} style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #E0E0E0', padding: '0 10px', fontSize: 13 }}>
                  <option value="transfer">Transfer Bank</option>
                  <option value="cash">Tunai</option>
                  <option value="giro">Giro</option>
                  <option value="cek">Cek</option>
                </select>
              </div>
              <button onClick={submitPayment} disabled={paying} style={{ width: '100%', padding: '9px 0', borderRadius: 7, background: '#5D4037', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {paying ? 'Menyimpan…' : 'Simpan Pembayaran'}
              </button>
            </div>
            {/* Riwayat Pembayaran */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F3F3', fontWeight: 700, color: '#5D4037', fontSize: 14 }}>Riwayat Pembayaran</div>
              {payments.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Belum ada pembayaran</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#F9F5F0' }}>{['Tanggal','Jumlah','Metode','Ref'].map(h => <th key={h} style={{ padding: '7px 12px', fontSize: 11, color: '#5D4037', fontWeight: 700, textAlign: 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p.id} style={{ borderTop: '1px solid #F3F3F3' }}>
                        <td style={{ padding: '7px 12px', fontSize: 12 }}>{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600, color: '#388E3C' }}>{IDR(Number(p.amount))}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12 }}>{p.method}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, color: '#888' }}>{p.referensi || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab: 3-Way Match */}
        {activeTab === 'match' && (
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            {!match ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#aaa' }}>Memuat data matching…</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  {match.matched ? (
                    <><CheckCircle size={20} color="#388E3C" /><span style={{ fontWeight: 700, color: '#388E3C', fontSize: 15 }}>Semua item cocok (Matched)</span></>
                  ) : (
                    <><AlertTriangle size={20} color="#EF6C00" /><span style={{ fontWeight: 700, color: '#EF6C00', fontSize: 15 }}>{match.discrepancies?.length ?? 0} item tidak cocok</span></>
                  )}
                </div>
                {match.discrepancies?.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: '#FFF3E0' }}>{['Produk','Qty PO','Qty GR','Qty Bill','Status'].map(h => <th key={h} style={{ padding: '8px 12px', fontSize: 11, color: '#EF6C00', fontWeight: 700, textAlign: 'left' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {match.discrepancies.map((d: any, i: number) => (
                        <tr key={i} style={{ borderTop: '1px solid #F3F3F3' }}>
                          <td style={{ padding: '8px 12px', fontSize: 13 }}>{d.nama}</td>
                          <td style={{ padding: '8px 12px', fontSize: 13 }}>{d.poQty ?? '–'}</td>
                          <td style={{ padding: '8px 12px', fontSize: 13 }}>{d.grQty ?? '–'}</td>
                          <td style={{ padding: '8px 12px', fontSize: 13 }}>{d.billQty}</td>
                          <td style={{ padding: '8px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: '#FFEBEE', color: '#C62828' }}>Tidak Cocok</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                  {[{ k: 'po', label: 'Purchase Order' }, { k: 'gr', label: 'Goods Receipt' }].map(s => (
                    <div key={s.k} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, background: match.summary?.[s.k] ? '#E8F5E9' : '#FFEBEE', color: match.summary?.[s.k] ? '#388E3C' : '#C62828' }}>
                      {s.label}: {match.summary?.[s.k] ? '✓ Ada' : '✗ Tidak ada'}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </ModernLayout>
  );
}
