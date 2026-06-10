'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ModernLayout } from '../../../../components/layout/ModernLayout';
import { PURCHASING_CONFIG, PURCHASING_NAV } from '../../../../lib/nav-configs';
import { api } from '../../../../lib/api';
import { ArrowLeft, Star, ShoppingBag, FileText, RotateCcw, Phone, Mail, MapPin, Plus } from 'lucide-react';

const IDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function SupplierDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<any>(null);
  const [history,  setHistory]  = useState<any>(null);
  const [pricelist, setPricelist] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'pricelist' | 'rating'>('overview');
  const [ratingForm, setRatingForm] = useState({ rating: 5, comment: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, h, p] = await Promise.all([
        api.get(`/purchasing/suppliers/${id}`),
        api.get(`/purchasing/suppliers/${id}/history`),
        api.get(`/purchasing/suppliers/${id}/price-list`),
      ]);
      setSupplier(s.data.data ?? s.data);
      setHistory(h.data.data ?? h.data);
      setPricelist(p.data.data ?? []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const submitRating = async () => {
    setSaving(true);
    try {
      await api.post(`/purchasing/suppliers/${id}/rating`, ratingForm);
      setRatingForm({ rating: 5, comment: '' });
      load();
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Gagal'); }
    finally { setSaving(false); }
  };

  if (loading) return <ModernLayout config={PURCHASING_CONFIG} navItems={PURCHASING_NAV} pageTitle="Detail Supplier"><div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Memuat…</div></ModernLayout>;
  if (!supplier) return <ModernLayout config={PURCHASING_CONFIG} navItems={PURCHASING_NAV} pageTitle="Detail Supplier"><div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Supplier tidak ditemukan</div></ModernLayout>;

  const recentPOs = history?.purchaseOrders ?? [];
  const recentBills = history?.vendorBills ?? [];
  const recentReturns = history?.purchaseReturns ?? [];
  const ratings = supplier.ratings ?? [];
  const avgRating = supplier.avgRating;

  return (
    <ModernLayout config={PURCHASING_CONFIG} navItems={PURCHASING_NAV} pageTitle="Profil Supplier">
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.back()} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <ArrowLeft size={14} /> Kembali
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#5D4037' }}>{supplier.name}</h2>
            {supplier.code && <span style={{ fontSize: 12, color: '#888' }}>Kode: {supplier.code}</span>}
          </div>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: '#FFF8E1', border: '1px solid #FFE082' }}>
              <Star size={16} fill="#F9A825" color="#F9A825" />
              <span style={{ fontWeight: 700, fontSize: 16, color: '#F57F17' }}>{avgRating.toFixed(1)}</span>
              <span style={{ fontSize: 12, color: '#888' }}>({ratings.length} ulasan)</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Total PO', value: supplier.totalPOs ?? recentPOs.length, icon: <ShoppingBag size={18} color="#5D4037" />, sub: 'purchase order' },
            { label: 'Total Bill', value: supplier.totalBills ?? recentBills.length, icon: <FileText size={18} color="#1976D2" />, sub: 'vendor bill' },
            { label: 'Total Retur', value: recentReturns.length, icon: <RotateCcw size={18} color="#C62828" />, sub: 'retur pembelian' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ padding: 10, borderRadius: 10, background: '#F9F5F0' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#5D4037' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #F3F3F3' }}>
          {[{ key: 'overview', label: 'Profil' }, { key: 'history', label: 'Riwayat Transaksi' }, { key: 'pricelist', label: 'Pricelist' }, { key: 'rating', label: 'Rating & Evaluasi' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 400, color: activeTab === t.key ? '#5D4037' : '#888', borderBottom: activeTab === t.key ? '2px solid #5D4037' : '2px solid transparent', marginBottom: -2 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <div style={{ fontWeight: 700, color: '#5D4037', marginBottom: 16, fontSize: 15 }}>Informasi Supplier</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: <Building2 size={14} color="#5D4037" />, label: 'Nama', value: supplier.name },
                { icon: <Phone size={14} color="#5D4037" />, label: 'Telepon', value: supplier.phone || '-' },
                { icon: <Mail size={14} color="#5D4037" />, label: 'Email', value: supplier.email || '-' },
                { icon: <MapPin size={14} color="#5D4037" />, label: 'Alamat', value: supplier.address || '-' },
                { icon: null, label: 'NPWP', value: supplier.npwp || '-' },
                { icon: null, label: 'Top (hari)', value: supplier.topHari ?? '-' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ padding: '2px 0', color: '#aaa' }}>{row.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>{row.label}</div>
                    <div style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>{row.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* POs */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3F3F3', fontWeight: 700, color: '#5D4037', fontSize: 14 }}>Purchase Orders ({recentPOs.length})</div>
              {recentPOs.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Belum ada PO</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#F9F5F0' }}>{['No PO','Tanggal','Total','Status'].map(h => <th key={h} style={{ padding: '7px 14px', fontSize: 11, color: '#5D4037', fontWeight: 700, textAlign: 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {recentPOs.map((po: any) => (
                      <tr key={po.id} style={{ borderTop: '1px solid #F3F3F3', cursor: 'pointer' }} onClick={() => router.push(`/purchasing/purchase-orders/${po.id}`)}>
                        <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#5D4037' }}>{po.noPo}</td>
                        <td style={{ padding: '8px 14px', fontSize: 12 }}>{new Date(po.tanggal).toLocaleDateString('id-ID')}</td>
                        <td style={{ padding: '8px 14px', fontSize: 13 }}>{IDR(Number(po.totalHarga))}</td>
                        <td style={{ padding: '8px 14px' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: '#EDE8F5', color: '#5D4037' }}>{po.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Bills */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3F3F3', fontWeight: 700, color: '#5D4037', fontSize: 14 }}>Vendor Bills ({recentBills.length})</div>
              {recentBills.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Belum ada bill</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#F9F5F0' }}>{['No Bill','Total','Dibayar','Status'].map(h => <th key={h} style={{ padding: '7px 14px', fontSize: 11, color: '#5D4037', fontWeight: 700, textAlign: 'left' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {recentBills.map((b: any) => (
                      <tr key={b.id} style={{ borderTop: '1px solid #F3F3F3', cursor: 'pointer' }} onClick={() => router.push(`/purchasing/bills/${b.id}`)}>
                        <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#5D4037' }}>{b.noBill}</td>
                        <td style={{ padding: '8px 14px', fontSize: 13 }}>{IDR(Number(b.totalAmount))}</td>
                        <td style={{ padding: '8px 14px', fontSize: 13, color: '#388E3C' }}>{IDR(Number(b.paidAmount ?? 0))}</td>
                        <td style={{ padding: '8px 14px' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: '#EDE8F5', color: '#5D4037' }}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Pricelist */}
        {activeTab === 'pricelist' && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3F3F3', fontWeight: 700, color: '#5D4037', fontSize: 14 }}>
              Daftar Harga Kontrak ({pricelist.length})
            </div>
            {pricelist.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Belum ada pricelist terdaftar</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#F9F5F0' }}>{['Produk ID','Harga','Min Qty','Lead Time','Valid Dari','Valid Sampai'].map(h => <th key={h} style={{ padding: '7px 14px', fontSize: 11, color: '#5D4037', fontWeight: 700, textAlign: 'left' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {pricelist.map((p: any) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #F3F3F3' }}>
                      <td style={{ padding: '8px 14px', fontSize: 12 }}>{p.productId}</td>
                      <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#5D4037' }}>{IDR(Number(p.harga))}</td>
                      <td style={{ padding: '8px 14px', fontSize: 12 }}>{p.minQty}</td>
                      <td style={{ padding: '8px 14px', fontSize: 12 }}>{p.leadTimeDays} hari</td>
                      <td style={{ padding: '8px 14px', fontSize: 12 }}>{p.validFrom ? new Date(p.validFrom).toLocaleDateString('id-ID') : '-'}</td>
                      <td style={{ padding: '8px 14px', fontSize: 12 }}>{p.validTo ? new Date(p.validTo).toLocaleDateString('id-ID') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Rating */}
        {activeTab === 'rating' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Beri Rating */}
            <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div style={{ fontWeight: 700, color: '#5D4037', marginBottom: 16 }}>Beri Evaluasi</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5D4037', display: 'block', marginBottom: 8 }}>Rating</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRatingForm(f => ({ ...f, rating: n }))} style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
                      <Star size={28} fill={ratingForm.rating >= n ? '#F9A825' : 'none'} color={ratingForm.rating >= n ? '#F9A825' : '#E0E0E0'} />
                    </button>
                  ))}
                  <span style={{ marginLeft: 6, alignSelf: 'center', fontSize: 14, fontWeight: 600, color: '#F57F17' }}>{ratingForm.rating}/5</span>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5D4037', display: 'block', marginBottom: 6 }}>Komentar</label>
                <textarea value={ratingForm.comment} onChange={e => setRatingForm(f => ({ ...f, comment: e.target.value }))} rows={3} placeholder="Evaluasi performa supplier…" style={{ width: '100%', borderRadius: 7, border: '1px solid #E0E0E0', padding: '8px 10px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <button onClick={submitRating} disabled={saving} style={{ width: '100%', padding: '9px 0', borderRadius: 7, background: '#5D4037', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {saving ? 'Menyimpan…' : 'Kirim Rating'}
              </button>
            </div>
            {/* Riwayat Rating */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3F3F3', fontWeight: 700, color: '#5D4037', fontSize: 14 }}>Riwayat Rating ({ratings.length})</div>
              {ratings.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#aaa', fontSize: 13 }}>Belum ada rating</div>
              ) : (
                <div style={{ padding: '0 0 8px' }}>
                  {ratings.slice(0, 10).map((r: any) => (
                    <div key={r.id} style={{ padding: '12px 18px', borderBottom: '1px solid #F9F9F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {[1,2,3,4,5].map(n => <Star key={n} size={14} fill={r.rating >= n ? '#F9A825' : 'none'} color={r.rating >= n ? '#F9A825' : '#E0E0E0'} />)}
                        <span style={{ fontWeight: 700, color: '#F57F17', fontSize: 13 }}>{r.rating}/5</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa' }}>{new Date(r.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                      {r.comment && <div style={{ fontSize: 13, color: '#555' }}>{r.comment}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  );
}

function Building2({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;
}
