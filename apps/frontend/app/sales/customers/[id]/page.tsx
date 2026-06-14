'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft, Phone, MapPin, Mail, TrendingUp, ShoppingCart,
  Link2, RefreshCw, User,
} from 'lucide-react';

const C = '#00ACC1';
const PURPLE = '#6366F1';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',      color: '#F59E0B' },
  confirmed:  { label: 'Dikonfirmasi', color: '#3B82F6' },
  processing: { label: 'Diproses',     color: '#8B5CF6' },
  shipped:    { label: 'Dikirim',      color: '#06B6D4' },
  delivered:  { label: 'Terkirim',     color: '#22C55E' },
  cancelled:  { label: 'Dibatalkan',   color: '#EF4444' },
  paid:       { label: 'Lunas',        color: '#22C55E' },
  unpaid:     { label: 'Belum Bayar',  color: '#EF4444' },
  draft:      { label: 'Draft',        color: '#94A3B8' },
};

const fmtRp   = (v: number) => v >= 1e6 ? `Rp ${(v / 1e6).toFixed(1)} Jt` : `Rp ${Number(v).toLocaleString('id-ID')}`;
const fmtDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '–';

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const isKledo = String(id).startsWith('kledo-');

  const load = async () => {
    setLoading(true);
    try {
      if (isKledo) {
        /* Pelanggan dari Kledo */
        const kledoId = String(id).replace('kledo-', '');
        const [cRes, invRes] = await Promise.allSettled([
          api.get(`/kledo/contacts/${kledoId}`),
          api.get('/kledo/invoices', { params: { contact_id: kledoId, per_page: 50 } }),
        ]);

        if (cRes.status === 'fulfilled') {
          const d = cRes.value.data;
          const c = d?.data ?? d;
          setCustomer({
            name:    c?.name ?? '–',
            phone:   c?.phone ?? c?.mobile_phone ?? '',
            email:   c?.email ?? '',
            city:    c?.city ?? '',
            address: c?.address ?? '',
            kledoId: kledoId,
            source:  'kledo',
            totalTransaction: 0,
            orderCount: 0,
          });
        } else { setNotFound(true); return; }

        if (invRes.status === 'fulfilled') {
          const d = invRes.value.data;
          const inner = d?.data ?? d;
          const list: any[] = Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [];
          const mapped = list.map((inv: any) => ({
            id: `kledo-${inv.id}`,
            soNumber: inv.ref_number ?? inv.trans_no ?? `K-${inv.id}`,
            totalAmount: Number(inv.amount ?? inv.total ?? 0),
            status: inv.status ?? 'draft',
            createdAt: inv.trans_date ?? '',
            source: 'kledo',
          }));
          setOrders(mapped);
          /* Hitung total transaksi */
          const total = mapped.reduce((s: number, r: any) => s + r.totalAmount, 0);
          setCustomer((prev: any) => ({ ...prev, totalTransaction: total, orderCount: mapped.length }));
        }
      } else {
        /* Pelanggan dari backend lokal */
        const [cRes, oRes] = await Promise.allSettled([
          api.get(`/customers/${id}`),
          api.get(`/customers/${id}/orders`),
        ]);

        if (cRes.status === 'fulfilled') {
          const d = cRes.value.data;
          setCustomer({ ...(d?.data ?? d), source: 'local' });
        } else { setNotFound(true); return; }

        if (oRes.status === 'fulfilled') {
          const d = oRes.value.data;
          setOrders(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
        }
      }
    } catch { setNotFound(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64, color: '#9CA3AF', fontSize: 13 }}>
      <RefreshCw size={14} className="animate-spin" style={{ marginRight: 8 }} /> Memuat data pelanggan…
    </div>
  );

  if (notFound) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, gap: 12 }}>
      <p style={{ fontSize: 13, color: '#9CA3AF' }}>Pelanggan tidak ditemukan</p>
      <button onClick={() => router.back()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', color: '#6B7280', fontSize: 13, cursor: 'pointer', background: '#fff' }}>
        <ArrowLeft size={13} /> Kembali
      </button>
    </div>
  );

  const accent = customer?.source === 'kledo' ? PURPLE : C;

  return (
    <>
      {/* Tombol kembali */}
      <button onClick={() => router.push('/sales/customers')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #EDE9FE', background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
        <ArrowLeft size={14} /> Kembali
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

        {/* Sidebar kiri */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Kartu profil */}
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1.5px solid #EDE9FE', padding: 20, textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: `linear-gradient(135deg,${accent}35,${accent}12)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accent, fontSize: 28, fontWeight: 800, margin: '0 auto 12px',
            }}>
              {customer.name?.charAt(0).toUpperCase() ?? <User size={28} />}
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1E1B4B', margin: '0 0 4px' }}>{customer.name}</h2>

            {/* Source badge */}
            {customer.source === 'kledo' && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 100, color: PURPLE, background: PURPLE + '12', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                <Link2 size={9} /> Kledo Contact {customer.kledoId ? `#${customer.kledoId}` : ''}
              </span>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {customer.phone && (
                <p style={{ fontSize: 12.5, color: '#6B7280', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Phone size={11} /> {customer.phone}
                </p>
              )}
              {customer.email && (
                <p style={{ fontSize: 12.5, color: '#6B7280', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Mail size={11} /> {customer.email}
                </p>
              )}
              {customer.city && (
                <p style={{ fontSize: 12.5, color: '#6B7280', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <MapPin size={11} /> {customer.city}
                </p>
              )}
            </div>
          </div>

          {/* Statistik */}
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1.5px solid #EDE9FE', padding: 18 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: '0 0 14px' }}>Statistik</h3>
            {[
              { icon: TrendingUp,  label: 'Total Transaksi', value: fmtRp(customer.totalTransaction ?? 0), color: accent },
              { icon: ShoppingCart, label: 'Jumlah Order',  value: `${customer.orderCount ?? orders.length} order`, color: '#22C55E' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={14} style={{ color: s.color }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 1px', letterSpacing: '.04em' }}>{s.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Catatan */}
          {customer.notes && (
            <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1.5px solid #EDE9FE', padding: 16 }}>
              <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: '.04em' }}>Catatan</p>
              <p style={{ fontSize: 13, color: '#1E1B4B', margin: 0, lineHeight: 1.6 }}>{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Kolom kanan — riwayat order */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1.5px solid #EDE9FE', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>
              Riwayat {isKledo ? 'Invoice Kledo' : 'Order'}
            </h3>
            {isKledo && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: PURPLE, background: PURPLE + '12' }}>
                dari Kledo
              </span>
            )}
          </div>

          {orders.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              Belum ada riwayat transaksi
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE9FE', background: '#FDFCFF' }}>
                    {['No. Order / Invoice', 'Tanggal', 'Total', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => {
                    const cfg = STATUS_CFG[o.status] ?? { label: o.status, color: '#94A3B8' };
                    return (
                      <tr key={o.id}
                        style={{ borderBottom: i < orders.length - 1 ? '1px solid #F0EDFB' : 'none', cursor: 'pointer', transition: 'background .12s' }}
                        onClick={() => router.push(o.source === 'kledo' ? `/sales/invoices/${o.id}` : `/sales/orders/${o.id}`)}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F9F8FF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: o.source === 'kledo' ? PURPLE : C, fontSize: 12, fontFamily: 'monospace' }}>
                          {o.soNumber ?? o.orderNumber ?? `#${o.id}`}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: 12 }}>{fmtDate(o.createdAt ?? o.tanggal)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1E1B4B' }}>{fmtRp(o.totalAmount ?? o.totalHarga ?? o.amount ?? 0)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 100, color: cfg.color, background: cfg.color + '18', border: `1px solid ${cfg.color}30` }}>
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
