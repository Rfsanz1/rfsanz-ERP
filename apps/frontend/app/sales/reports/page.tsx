'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { TrendingUp, ShoppingCart, Users, Target, RefreshCw, Link2 } from 'lucide-react';

const C      = '#00ACC1';
const PURPLE = '#6366F1';

interface SalesReport { month: string; revenue: number; orders: number; newCustomers: number; }

export default function SalesReportsPage() {
  const [data, setData]         = useState<SalesReport[]>([]);
  const [kledoStats, setKStats] = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      /* Ambil laporan bulanan dari lokal + ringkasan Kledo secara paralel */
      const [localRes, kledoRes, invRes] = await Promise.allSettled([
        api.get('/sales/reports/monthly?months=6'),
        api.get('/kledo/status'),
        api.get('/kledo/invoices', { params: { per_page: 200 } }),
      ]);

      /* Data bulanan dari backend lokal */
      if (localRes.status === 'fulfilled') {
        const d = localRes.value.data;
        const list = d?.data ?? d ?? [];
        if (Array.isArray(list) && list.length > 0) {
          setData(list);
        }
      }

      /* Hitung ringkasan dari Kledo invoices jika data lokal kosong */
      if (invRes.status === 'fulfilled') {
        const d = invRes.value.data;
        const inner = d?.data ?? d;
        const list: any[] = Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [];

        /* Hanya pakai Kledo jika data lokal kosong */
        if (data.length === 0 && list.length > 0) {
          /* Kelompokkan per bulan */
          const map: Record<string, { revenue: number; orders: number }> = {};
          list.forEach((inv: any) => {
            const d = inv.trans_date ?? inv.createdAt ?? '';
            if (!d) return;
            const dt = new Date(d);
            const key = dt.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
            if (!map[key]) map[key] = { revenue: 0, orders: 0 };
            map[key].revenue += Number(inv.amount ?? inv.total ?? 0);
            map[key].orders  += 1;
          });
          const months = Object.entries(map)
            .sort(([a], [b]) => new Date('1 ' + a).getTime() - new Date('1 ' + b).getTime())
            .slice(-6)
            .map(([month, v]) => ({ month, ...v, newCustomers: 0 }));
          setData(months);
        }

        /* Statistik Kledo */
        setKStats({
          totalInvoices: list.length,
          totalRevenue:  list.reduce((s: number, r: any) => s + Number(r.amount ?? r.total ?? 0), 0),
          paid:          list.filter((r: any) => r.status === 'paid').length,
          unpaid:        list.filter((r: any) => r.status !== 'paid').length,
        });
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmtRp = (v: number) =>
    v >= 1e9 ? `Rp ${(v / 1e9).toFixed(1)} M` :
    v >= 1e6 ? `Rp ${(v / 1e6).toFixed(1)} Jt` :
    `Rp ${v.toLocaleString('id-ID')}`;

  const maxRevenue    = Math.max(...data.map(d => d.revenue), 1);
  const totalRevenue  = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders   = data.reduce((s, d) => s + d.orders, 0);
  const totalCustomers = data.reduce((s, d) => s + d.newCustomers, 0);

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Laporan Sales
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            6 bulan terakhir · data real-time dari ERP &amp; Kledo
          </p>
        </div>
        <button onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Kartu statistik dari ERP lokal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Revenue',  value: fmtRp(totalRevenue), icon: TrendingUp, color: '#22C55E' },
          { label: 'Total Order',    value: `${totalOrders} order`,  icon: ShoppingCart, color: C },
          { label: 'Pelanggan Baru', value: totalCustomers > 0 ? `${totalCustomers} orang` : '–', icon: Users, color: '#F59E0B' },
          { label: 'Rata-rata/Bulan', value: fmtRp(Math.round(totalRevenue / Math.max(data.length, 1))), icon: Target, color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>{s.label}</p>
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Ringkasan Kledo */}
      {kledoStats && (
        <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 14, border: `1.5px solid ${PURPLE}25`, background: PURPLE + '08' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Link2 size={14} style={{ color: PURPLE }} />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: PURPLE, margin: 0 }}>Ringkasan Invoice Kledo</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
            {[
              { label: 'Total Invoice', value: kledoStats.totalInvoices, color: PURPLE },
              { label: 'Total Revenue', value: fmtRp(kledoStats.totalRevenue), color: '#22C55E' },
              { label: 'Sudah Lunas',  value: kledoStats.paid, color: '#22C55E' },
              { label: 'Belum Bayar',  value: kledoStats.unpaid, color: '#EF4444' },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px', letterSpacing: '.04em' }}>{s.label}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart batang horizontal — revenue bulanan */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 22 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 20px' }}>Revenue Bulanan</h3>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48, fontSize: 13 }}>Memuat data…</div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48, fontSize: 13 }}>
            Tidak ada data — pastikan backend terhubung
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.map(d => (
              <div key={d.month} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 150px', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>{d.month}</span>
                <div style={{ backgroundColor: 'var(--surface-sunken)', borderRadius: 100, overflow: 'hidden', height: 10 }}>
                  <div style={{
                    width: `${(d.revenue / maxRevenue) * 100}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${C}, ${PURPLE})`,
                    borderRadius: 100,
                    transition: 'width .5s ease',
                  }} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtRp(d.revenue)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>· {d.orders} order</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
