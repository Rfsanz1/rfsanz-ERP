'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft, Package, User, MapPin, Calendar, Phone, FileText,
  Link2, RefreshCw, CheckCircle2, AlertCircle, Clock, Send,
  ChevronRight, Tag, Percent,
} from 'lucide-react';

const C = '#00ACC1';
const PURPLE = '#6366F1';

const STATUS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',      color: '#F59E0B' },
  draft:      { label: 'Draft',        color: '#94A3B8' },
  confirmed:  { label: 'Dikonfirmasi', color: '#3B82F6' },
  processing: { label: 'Diproses',     color: '#8B5CF6' },
  shipped:    { label: 'Dikirim',      color: '#06B6D4' },
  delivered:  { label: 'Terkirim',     color: '#22C55E' },
  cancelled:  { label: 'Dibatalkan',   color: '#EF4444' },
};

const fmtRp   = (v: any) => Number(v ?? 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const fmtDate = (v: any) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '–';

function Badge({ status }: { status: string }) {
  const cfg = STATUS[status] ?? { label: status, color: '#94A3B8' };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, color: cfg.color, background: cfg.color + '18', border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0" style={{ background: `${C}12` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: C }} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{label}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: '#1E1B4B' }}>{value}</p>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [kledoSyncing, setKledoSyncing] = useState(false);
  const [kledoMsg, setKledoMsg] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      /* Coba endpoint orders dulu, lalu sales/orders */
      let data: any = null;
      for (const url of [`/orders/${id}`, `/sales/orders/${id}`]) {
        try {
          const r = await api.get(url);
          data = r.data?.data ?? r.data;
          if (data?.id) break;
        } catch {}
      }
      if (data?.id) setOrder(data);
      else setNotFound(true);
    } catch { setNotFound(true); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* Kirim ulang ke Kledo */
  const retryKledo = async () => {
    if (!order) return;
    setKledoSyncing(true); setKledoMsg('');
    try {
      const kledoItems = (order.orderItems ?? order.items ?? []).map((it: any) => {
        const qty   = Number(it.qty ?? it.quantity ?? 1);
        const price = Number(it.harga ?? it.unitPrice ?? it.price ?? 0);
        return {
          product_id: it.kledoProductId ? Number(it.kledoProductId) : undefined,
          name_item: it.nama ?? it.productName,
          qty,
          price,
          amount: qty * price,
          discount_percent: it.diskon ? Number(it.diskon) : undefined,
        };
      });
      await api.post('/kledo/invoices', {
        trans_date: order.tanggal ?? order.createdAt?.slice(0, 10),
        due_date: order.jatuhTempo ?? undefined,
        ref_number: order.noReferensi ?? order.soNumber ?? undefined,
        memo: order.catatan ?? order.notes ?? undefined,
        contact_id: order.kledoContactId ? Number(order.kledoContactId) : undefined,
        contact_name: order.namaCustomer ?? order.customerName,
        include_tax: 0,
        discount: order.diskonTotal || undefined,
        items: kledoItems,
      });
      setKledoMsg('ok');
    } catch { setKledoMsg('error'); }
    finally { setKledoSyncing(false); }
  };

  /* Update status */
  const updateStatus = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      await api.patch(`/orders/${id}`, { status: newStatus });
      setOrder((o: any) => ({ ...o, status: newStatus }));
    } catch {}
    finally { setStatusUpdating(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#9CA3AF' }}>
      <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Memuat order…
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-sm font-semibold" style={{ color: '#9CA3AF' }}>Order tidak ditemukan</p>
      <button onClick={() => router.back()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ border: '1.5px solid #E5E7EB', color: '#6B7280' }}>
        <ArrowLeft className="h-3.5 w-3.5" /> Kembali
      </button>
    </div>
  );

  const items = order.items ?? order.orderItems ?? [];
  const statusNext: Record<string, string> = {
    pending: 'confirmed', confirmed: 'processing', processing: 'shipped', shipped: 'delivered',
  };
  const nextStatus = statusNext[order.status];

  return (
    <div className="space-y-5 max-w-4xl mx-auto p-1">

      {/* Topbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/sales/orders')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ border: '1.5px solid #E5E7EB', color: '#6B7280' }}>
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#1E1B4B' }}>
              {order.soNumber ?? order.orderNumber ?? `Order #${id}`}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge status={order.status ?? 'pending'} />
              {order.kledoInvoiceId && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${PURPLE}12`, color: PURPLE }}>
                  <Link2 className="h-2.5 w-2.5" /> Kledo #{order.kledoInvoiceId}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Kirim ke Kledo */}
          <button onClick={retryKledo} disabled={kledoSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
            style={{ border: `1.5px solid ${PURPLE}`, color: PURPLE }}>
            {kledoSyncing
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            {kledoSyncing ? 'Mengirim…' : 'Kirim ke Kledo'}
          </button>

          {/* Maju status */}
          {nextStatus && (
            <button onClick={() => updateStatus(nextStatus)} disabled={statusUpdating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: C }}>
              <ChevronRight className="h-3.5 w-3.5" />
              {STATUS[nextStatus]?.label ?? nextStatus}
            </button>
          )}
        </div>
      </div>

      {/* Status Kledo */}
      {kledoMsg && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{
            background: kledoMsg === 'ok' ? 'rgba(34,197,94,.08)' : 'rgba(234,84,85,.08)',
            border: `1.5px solid ${kledoMsg === 'ok' ? 'rgba(34,197,94,.25)' : 'rgba(234,84,85,.25)'}`,
            color: kledoMsg === 'ok' ? '#16A34A' : '#EA5455',
          }}>
          {kledoMsg === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {kledoMsg === 'ok' ? 'Berhasil dikirim ke Kledo sebagai invoice' : 'Gagal mengirim ke Kledo — coba lagi nanti'}
        </div>
      )}

      {/* Status Timeline */}
      <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #F0EDFB' }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Status Order</p>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((s, i, arr) => {
            const cfg = STATUS[s] ?? { label: s, color: '#94A3B8' };
            const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
            const currentIdx = statusOrder.indexOf(order.status ?? 'pending');
            const isActive   = s === order.status;
            const isDone     = statusOrder.indexOf(s) < currentIdx;
            return (
              <div key={s} className="flex items-center gap-1 flex-shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: isDone ? '#22C55E' : isActive ? cfg.color : '#F3F4F6',
                      color: isDone || isActive ? '#fff' : '#9CA3AF',
                    }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] font-semibold whitespace-nowrap"
                    style={{ color: isActive ? cfg.color : isDone ? '#22C55E' : '#9CA3AF' }}>
                    {cfg.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="h-0.5 w-8 flex-shrink-0 rounded"
                    style={{ background: isDone ? '#22C55E' : '#F3F4F6', marginBottom: 18 }} />
                )}
              </div>
            );
          })}
          {order.status === 'cancelled' && (
            <div className="flex flex-col items-center gap-1 ml-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <span className="text-xs font-bold text-red-500">✕</span>
              </div>
              <span className="text-[10px] font-semibold text-red-400">Dibatalkan</span>
            </div>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Info Pelanggan */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: '1.5px solid #F0EDFB' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Pelanggan</p>
          <InfoRow icon={User}     label="Nama"   value={order.namaCustomer ?? order.customerName ?? '–'} />
          {(order.noHp ?? order.customerPhone) && (
            <InfoRow icon={Phone}   label="No. HP" value={order.noHp ?? order.customerPhone} />
          )}
          {(order.alamat ?? order.shippingAddress) && (
            <InfoRow icon={MapPin}  label="Alamat" value={order.alamat ?? order.shippingAddress} />
          )}
        </div>

        {/* Info Transaksi */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: '1.5px solid #F0EDFB' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Info Transaksi</p>
          <InfoRow icon={Calendar} label="Tanggal"       value={fmtDate(order.tanggal ?? order.createdAt)} />
          {order.jatuhTempo && <InfoRow icon={Clock}    label="Jatuh Tempo"  value={fmtDate(order.jatuhTempo)} />}
          {order.noReferensi && <InfoRow icon={FileText} label="No. Referensi" value={order.noReferensi} />}
          {order.salesName   && <InfoRow icon={User}     label="Sales"        value={order.salesName} />}
          {order.catatan     && <InfoRow icon={FileText} label="Catatan"      value={order.catatan} />}
        </div>
      </div>

      {/* Daftar Produk */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0EDFB' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1.5px solid #F0EDFB' }}>
          <p className="text-sm font-bold" style={{ color: '#1E1B4B' }}>
            Daftar Produk · {items.length} item
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FDFCFF', borderBottom: '1px solid #F0EDFB' }}>
                {['#', 'Produk', 'Qty', 'Satuan', 'Harga', 'Diskon', 'Subtotal'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: '#9CA3AF' }}>Tidak ada item</td></tr>
              ) : items.map((it: any, i: number) => (
                <tr key={it.id ?? i} style={{ borderBottom: i < items.length - 1 ? '1px solid #F5F3FF' : 'none' }}>
                  <td className="px-5 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>{it.nama ?? it.productName ?? it.name}</p>
                    {it.kledoProductId && (
                      <span className="text-[10px] font-medium" style={{ color: PURPLE }}>
                        <Link2 className="h-2.5 w-2.5 inline mr-0.5" />Kledo #{it.kledoProductId}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: '#6B7280' }}>{it.qty ?? it.quantity}</td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{it.unit ?? it.satuan ?? '–'}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: '#6B7280' }}>{fmtRp(it.harga ?? it.unitPrice ?? it.price)}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: '#EF4444' }}>{it.diskon ? `-${fmtRp(it.diskon)}` : '–'}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{fmtRp(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ringkasan total */}
        <div className="px-5 py-4 space-y-2" style={{ borderTop: '1.5px solid #F0EDFB', background: '#FDFCFF' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#6B7280' }}>Subtotal</span>
            <span className="font-semibold" style={{ color: '#1E1B4B' }}>{fmtRp(order.subtotal ?? order.totalHarga)}</span>
          </div>
          {Number(order.diskonTotal) > 0 && (
            <div className="flex justify-between text-sm items-center gap-2">
              <span className="flex items-center gap-1" style={{ color: '#6B7280' }}><Tag className="h-3.5 w-3.5" /> Diskon Total</span>
              <span className="font-semibold" style={{ color: '#EF4444' }}>-{fmtRp(order.diskonTotal)}</span>
            </div>
          )}
          {Number(order.pajak) > 0 && (
            <div className="flex justify-between text-sm items-center gap-2">
              <span className="flex items-center gap-1" style={{ color: '#6B7280' }}><Percent className="h-3.5 w-3.5" /> Pajak / PPN</span>
              <span className="font-semibold" style={{ color: '#1E1B4B' }}>{fmtRp(order.pajak)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid #E5E7EB' }}>
            <span className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Grand Total</span>
            <span className="text-xl font-bold" style={{ color: C }}>
              {fmtRp(order.totalHarga ?? order.totalAmount ?? order.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Tombol Batalkan */}
      {!['delivered', 'cancelled'].includes(order.status) && (
        <div className="flex justify-end">
          <button onClick={() => updateStatus('cancelled')} disabled={statusUpdating}
            className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
            style={{ border: '1.5px solid rgba(234,84,85,.4)', color: '#EA5455' }}>
            Batalkan Order
          </button>
        </div>
      )}
    </div>
  );
}
