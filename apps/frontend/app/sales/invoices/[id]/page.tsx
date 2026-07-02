'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { api } from '@/lib/api';
import { ArrowLeft, Send, CreditCard, RefreshCw, MessageSquare, ExternalLink } from 'lucide-react';

const C = '#00ACC1';
const fmt = (v: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v ?? 0));
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',    color: '#9E9E9E', bg: 'rgba(158,158,158,.12)' },
  sent:      { label: 'Terkirim', color: '#2196F3', bg: 'rgba(33,150,243,.12)' },
  partial:   { label: 'Sebagian',color: '#FF9800', bg: 'rgba(255,152,0,.12)' },
  paid:      { label: 'Lunas',   color: '#4CAF50', bg: 'rgba(76,175,80,.12)' },
  overdue:   { label: 'Telat',   color: '#F44336', bg: 'rgba(244,67,54,.12)' },
  cancelled: { label: 'Batal',  color: '#616161', bg: 'rgba(97,97,97,.12)' },
};

type Tab = 'info' | 'payments' | 'journal';

export default function InvoiceDetailPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(true);
  const [payForm, setPayForm] = useState({ amount: '', method: 'transfer', bankPilihan: '', edcPilihan: '', reference: '', notes: '' });
  const [paying, setPaying] = useState(false);
  const [waPhone, setWaPhone] = useState('087828609655');
  const [showWa, setShowWa] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [msg, setMsg] = useState('');


  const load = async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        api.get(`/invoices/${id}`),
        api.get(`/invoices/${id}/payments`),
      ]);
      setInv(r.data.data);
      setPayments(p.data.data ?? []);
    } catch { router.push('/sales/invoices'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token, id]);
  if (!token || loading) return <AppShell><div className="flex items-center justify-center h-64 text-sm" style={{ color: '#9CA3AF' }}>Memuat...</div></AppShell>;
  if (!inv) return null;

  const outstanding = Number(inv.grandTotal) - Number(inv.paidAmount ?? 0);
  const statusCfg = STATUS[inv.status] ?? STATUS.draft;

  const doSend = async () => {
    setActionLoading('send');
    try { await api.post(`/invoices/${id}/send`); setMsg('Invoice berhasil dikirim'); await load(); } catch {} finally { setActionLoading(''); }
  };

  /** Deteksi unitBisnis dari item invoice (ambil yang pertama ketemu) */
  const detectUnitBisnis = (): string => {
    for (const it of inv?.items ?? []) {
      const u = it.product?.category?.unitBisnis ?? it.unitBisnis ?? '';
      if (u) return u;
    }
    return '';
  };

  const doPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.amount) return;
    setPaying(true);
    try {
      // 1. Simpan pembayaran ke database lokal
      await api.post(`/invoices/${id}/payments`, { ...payForm, amount: Number(payForm.amount) });

      // 2. Push pembayaran ke Kledo jika invoice punya kledoInvoiceId
      if (inv?.kledoInvoiceId) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const unitBisnis = (payForm.method === 'cash' || payForm.method === 'tunai')
            ? detectUnitBisnis()
            : '';
          const kledoRes = await fetch(`/api/invoices/${id}/kledo-pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              kledoInvoiceId: inv.kledoInvoiceId,
              amount:      Number(payForm.amount),
              method:      payForm.method,
              bankPilihan: payForm.bankPilihan || undefined,
              edcPilihan:  payForm.edcPilihan  || undefined,
              unitBisnis:  unitBisnis           || undefined,
              date:        today,
            }),
          });
          const kledoData = await kledoRes.json();
          if (kledoData.ok) {
            setMsg('Pembayaran berhasil dicatat & dikirim ke Kledo ✓');
          } else {
            setMsg(`Pembayaran dicatat lokal. Kledo: ${kledoData.error ?? 'gagal'}`);
          }
        } catch {
          setMsg('Pembayaran dicatat lokal. Sinkronisasi Kledo gagal.');
        }
      } else {
        setMsg('Pembayaran berhasil dicatat');
      }

      setPayForm({ amount: '', method: 'transfer', bankPilihan: '', edcPilihan: '', reference: '', notes: '' });
      await load();
      setTab('payments');
    } catch {} finally { setPaying(false); }
  };

  const doSendWa = async () => {
    if (!waPhone.trim()) { setMsg('Isi nomor WA tujuan terlebih dahulu'); return; }
    setActionLoading('wa');
    try {
      const fonnteConfig = JSON.parse(localStorage.getItem('erp_intg_fonnte') ?? '{}');
      const fonnteToken = fonnteConfig.token ?? '';

      if (fonnteToken) {
        const customerName = inv?.customer?.name ?? '';
        const invoiceNo = inv?.noInvoice ?? '';
        const grandTotal = Number(inv?.grandTotal ?? 0).toLocaleString('id-ID');
        const dueFmt = inv?.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
        const message = `Halo ${customerName}, invoice ${invoiceNo} senilai Rp ${grandTotal} jatuh tempo pada ${dueFmt}. Mohon segera melakukan pembayaran. Terima kasih.`;
        const wr = await fetch('/api/direct/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: fonnteToken, target: waPhone, message }),
        });
        const wd = await wr.json();
        if (wr.ok && wd.status !== false) {
          setMsg('Notifikasi WA berhasil dikirim ✓');
          setShowWa(false);
        } else {
          setMsg(`Gagal kirim WA: ${wd.reason ?? wd.message ?? 'Error tidak diketahui'}`);
        }
      } else {
        try {
          const r = await api.post(`/invoices/${id}/send-whatsapp`, { phone: waPhone });
          setMsg(r.data.message ?? 'Terkirim');
          setShowWa(false);
        } catch (e: any) {
          const errMsg = e?.response?.data?.message ?? e?.message ?? 'Error';
          setMsg(`Gagal kirim WA: ${errMsg}. Token Fonnte belum diatur di Settings → WA Gateway.`);
        }
      }
    } catch (e: any) {
      setMsg(`Gagal kirim WA: ${e?.message ?? 'Error tidak diketahui'}`);
    } finally { setActionLoading(''); }
  };

  const doReminder = async () => {
    setActionLoading('reminder');
    try { const r = await api.post(`/invoices/${id}/send-reminder`); setMsg(r.data.message ?? 'Reminder terkirim'); } catch {} finally { setActionLoading(''); }
  };

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {msg && (
          <div className="rounded-xl p-3 text-sm flex items-center justify-between" style={{ backgroundColor: 'rgba(76,175,80,.08)', color: '#4CAF50', border: '1px solid rgba(76,175,80,.2)' }}>
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="text-lg leading-none">×</button>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/sales/invoices')} className="p-2 rounded-lg" style={{ border: '1px solid #EDE8F5', color: C }}><ArrowLeft className="h-4 w-4" /></button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>{inv.noInvoice}</h1>
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}>{statusCfg.label}</span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{inv.customer?.name ?? '–'}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {inv.status === 'draft' && (
              <button onClick={doSend} disabled={actionLoading === 'send'} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#2196F3' }}>
                <Send className="h-3.5 w-3.5" /> Kirim
              </button>
            )}
            <button onClick={() => setShowWa(!showWa)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: `1.5px solid ${C}`, color: C }}>
              <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
            </button>
            <button onClick={doReminder} disabled={actionLoading === 'reminder'} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #FF9800', color: '#FF9800' }}>
              <RefreshCw className="h-3.5 w-3.5" /> Reminder
            </button>
            <a href={`/api/invoices/${id}/pdf`} target="_blank" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #9CA3AF', color: '#9CA3AF' }}>
              <ExternalLink className="h-3.5 w-3.5" /> PDF
            </a>
          </div>
        </div>

        {showWa && (
          <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1.5px solid #EDE8F5' }}>
            <h4 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Kirim via WhatsApp</h4>
            <div className="flex gap-2">
              <input className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}
                placeholder={`No. WA (default: ${inv.customer?.phone ?? 'belum ada'})`} value={waPhone} onChange={e => setWaPhone(e.target.value)} />
              <button onClick={doSendWa} disabled={actionLoading === 'wa'} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#25D366' }}>Kirim</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Grand Total', value: fmt(inv.grandTotal), color: '#1E1B4B' },
            { label: 'Sudah Dibayar', value: fmt(inv.paidAmount), color: '#4CAF50' },
            { label: 'Outstanding', value: fmt(outstanding), color: outstanding > 0 ? '#F44336' : '#4CAF50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 text-center" style={{ border: '1.5px solid #EDE8F5' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-lg font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#F5F2FB' }}>
          {([['info', 'Info'], ['payments', 'Pembayaran'], ['journal', 'Tambah Bayar']] as [Tab, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition"
              style={tab === k ? { backgroundColor: 'white', color: '#1E1B4B', boxShadow: '0 1px 3px rgba(47,43,61,.1)' } : { color: '#9CA3AF' }}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1.5px solid #EDE8F5' }}>
              <h3 className="text-sm font-bold pb-2" style={{ color: '#1E1B4B', borderBottom: '1px solid #EDE8F5' }}>Info Invoice</h3>
              {[['Nomor', inv.noInvoice], ['Tanggal', fmtDate(inv.tanggal)], ['Jatuh Tempo', fmtDate(inv.dueDate)], ['Sales', inv.salesName || '–'], ['Catatan', inv.notes || '–']].map(([l, v]) => (
                <div key={l} className="flex gap-3"><span className="text-xs w-28 flex-shrink-0" style={{ color: '#9CA3AF' }}>{l}</span><span className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{v}</span></div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1.5px solid #EDE8F5' }}>
              <h3 className="text-sm font-bold pb-2" style={{ color: '#1E1B4B', borderBottom: '1px solid #EDE8F5' }}>Pelanggan</h3>
              {[['Nama', inv.customer?.name], ['Telepon', inv.customer?.phone], ['Email', inv.customer?.email]].map(([l, v]) => (
                <div key={l} className="flex gap-3"><span className="text-xs w-28 flex-shrink-0" style={{ color: '#9CA3AF' }}>{l}</span><span className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{v || '–'}</span></div>
              ))}
            </div>
            <div className="md:col-span-2 bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Item Invoice</h3>
              </div>
              <table className="w-full">
                <thead><tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#FDFCFF' }}>
                  {['#', 'Produk', 'Qty', 'Harga', 'Subtotal'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {(inv.items ?? []).map((it: any, i: number) => (
                    <tr key={it.id} style={{ borderBottom: i < inv.items.length - 1 ? '1px solid #F5F2FB' : 'none' }}>
                      <td className="px-5 py-3 text-xs" style={{ color: '#9CA3AF' }}>{i + 1}</td>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: '#1E1B4B' }}>{it.nama}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: '#9CA3AF' }}>{it.qty}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: '#9CA3AF' }}>{fmt(it.harga)}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{fmt(it.subtotal)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid #EDE8F5' }}>
                    <td colSpan={4} className="px-5 py-3 text-xs text-right font-semibold" style={{ color: '#9CA3AF' }}>Subtotal</td>
                    <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{fmt(inv.subtotal)}</td>
                  </tr>
                  {Number(inv.diskon) > 0 && <tr><td colSpan={4} className="px-5 py-1.5 text-xs text-right" style={{ color: '#9CA3AF' }}>Diskon</td><td className="px-5 py-1.5 text-sm" style={{ color: '#F44336' }}>-{fmt(inv.diskon)}</td></tr>}
                  {Number(inv.pajak) > 0 && <tr><td colSpan={4} className="px-5 py-1.5 text-xs text-right" style={{ color: '#9CA3AF' }}>Pajak</td><td className="px-5 py-1.5 text-sm" style={{ color: '#1E1B4B' }}>{fmt(inv.pajak)}</td></tr>}
                  <tr style={{ backgroundColor: 'rgba(0,172,193,.06)' }}>
                    <td colSpan={4} className="px-5 py-3 text-sm text-right font-bold" style={{ color: '#1E1B4B' }}>Grand Total</td>
                    <td className="px-5 py-3 text-base font-bold" style={{ color: C }}>{fmt(inv.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
              <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Riwayat Pembayaran</h3>
            </div>
            {payments.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>Belum ada pembayaran</div>
            ) : (
              <table className="w-full">
                <thead><tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#FDFCFF' }}>
                  {['Tanggal', 'Metode', 'Referensi', 'Jumlah'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < payments.length - 1 ? '1px solid #F5F2FB' : 'none' }}>
                      <td className="px-5 py-3 text-xs" style={{ color: '#9CA3AF' }}>{fmtDate(p.tanggal)}</td>
                      <td className="px-5 py-3 text-sm capitalize" style={{ color: '#1E1B4B' }}>{p.method}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: '#9CA3AF' }}>{p.referensi || '–'}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#4CAF50' }}>{fmt(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'journal' && (
          <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: '1.5px solid #EDE8F5' }}>
            <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Catat Pembayaran</h3>
            {inv.status === 'paid' ? (
              <p className="text-sm" style={{ color: '#4CAF50' }}>Invoice sudah lunas.</p>
            ) : (
              <form onSubmit={doPayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Jumlah */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Jumlah Bayar (Rp)*</label>
                    <input type="number" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}
                      value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder={`Max: ${Number(outstanding).toLocaleString('id-ID')}`} max={outstanding} min={1} required />
                  </div>

                  {/* Metode */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Metode</label>
                    <select className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}
                      value={payForm.method}
                      onChange={e => setPayForm(f => ({ ...f, method: e.target.value, bankPilihan: '', edcPilihan: '' }))}>
                      <option value="transfer">Transfer</option>
                      <option value="debit">Debit / EDC</option>
                      <option value="cash">Cash / Tunai</option>
                    </select>
                  </div>

                  {/* Bank (hanya tampil saat transfer) */}
                  {payForm.method === 'transfer' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Bank</label>
                      <select className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}
                        value={payForm.bankPilihan}
                        onChange={e => setPayForm(f => ({ ...f, bankPilihan: e.target.value }))}>
                        <option value="">— Pilih Bank —</option>
                        <option value="bca">BCA → BCA Giro</option>
                        <option value="bri">BRI → BRI EDC</option>
                        <option value="bni">BNI → BNI</option>
                        <option value="mandiri">Mandiri → Mandiri</option>
                      </select>
                    </div>
                  )}

                  {/* EDC (hanya tampil saat debit) */}
                  {payForm.method === 'debit' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Mesin EDC</label>
                      <select className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}
                        value={payForm.edcPilihan}
                        onChange={e => setPayForm(f => ({ ...f, edcPilihan: e.target.value }))}>
                        <option value="">— Pilih EDC —</option>
                        <option value="bca_edc">BCA EDC → BCA EDC</option>
                        <option value="bri_edc">BRI EDC → BRI EDC</option>
                        <option value="bni_edc">BNI EDC → BNI</option>
                      </select>
                    </div>
                  )}

                  {/* Info otomatis untuk cash */}
                  {payForm.method === 'cash' && (
                    <div className="flex flex-col gap-1 justify-end">
                      <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: '#F5F2FB', color: '#6B7280' }}>
                        Otomatis ke: <strong style={{ color: '#1E1B4B' }}>
                          {detectUnitBisnis() === 'elektronik'     ? 'KAS ELEKTRONIK' :
                           detectUnitBisnis() === 'bahan_bangunan' ? 'KAS SULAWESI'   : 'Kas (umum)'}
                        </strong> berdasarkan kategori produk
                      </p>
                    </div>
                  )}

                  {/* Referensi */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Referensi / No. Bukti</label>
                    <input className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}
                      value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} placeholder="No. bukti transfer..." />
                  </div>

                  {/* Catatan */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Catatan</label>
                    <input className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}
                      value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan opsional..." />
                  </div>
                </div>

                <button type="submit" disabled={paying} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#4CAF50' }}>
                  <CreditCard className="h-4 w-4" /> {paying ? 'Menyimpan...' : 'Catat Pembayaran'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
