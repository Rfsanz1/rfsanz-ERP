'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/useAuthStore';
import api from '../../lib/api';
import { ArrowLeft, TrendingUp, ShoppingCart, DollarSign, Banknote, Smartphone, CreditCard } from 'lucide-react';

const C = '#059669';
const CLT = '#ECFDF5';

interface HourData { hour: number; count: number; revenue: number; }

const DEMO_HOURLY: HourData[] = [
  { hour:8, count:3, revenue:145000 },
  { hour:9, count:7, revenue:320000 },
  { hour:10, count:12, revenue:580000 },
  { hour:11, count:9, revenue:425000 },
  { hour:12, count:5, revenue:240000 },
  { hour:13, count:8, revenue:375000 },
  { hour:14, count:11, revenue:520000 },
  { hour:15, count:6, revenue:285000 },
  { hour:16, count:4, revenue:195000 },
];

const DEMO_METHODS = [
  { method:'Tunai', icon:Banknote, amount:1580000, count:21, color:'#059669' },
  { method:'Transfer', icon:Smartphone, amount:850000, count:11, color:'#3B82F6' },
  { method:'Kartu', icon:CreditCard, amount:320000, count:5, color:'#8B5CF6' },
  { method:'QRIS', icon:ShoppingCart, amount:175000, count:4, color:'#F59E0B' },
];

export default function ReportsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [hourly, setHourly] = useState<HourData[]>(DEMO_HOURLY);
  const [methods] = useState(DEMO_METHODS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.replace('/login'); return; }
    api.get('/pos/reports/today').then(r => { if (r.data?.hourly) setHourly(r.data.hourly); }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const totalRevenue = methods.reduce((s, m) => s + m.amount, 0);
  const totalTx = methods.reduce((s, m) => s + m.count, 0);
  const avgTx = totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0;
  const maxRevenue = Math.max(...hourly.map(h => h.revenue));
  const fmt = (v: number) => v >= 1e6 ? `Rp ${(v/1e6).toFixed(1)} Jt` : `Rp ${v.toLocaleString('id-ID')}`;

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#F0FDF4', fontFamily:'Inter,sans-serif' }}>
      <header style={{ background:`linear-gradient(135deg,#047857,${C})`, padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={() => router.push('/')} style={{ padding:8, border:'none', background:'rgba(255,255,255,.15)', borderRadius:8, cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={18}/></button>
        <h1 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0, flex:1 }}>Laporan Kasir</h1>
        <span style={{ fontSize:12, color:'rgba(255,255,255,.8)' }}>Hari Ini</span>
      </header>

      <div style={{ padding:16, maxWidth:700, margin:'0 auto' }}>
        {/* KPI Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
          {[
            { label:'Total Omzet', value:fmt(totalRevenue), icon:TrendingUp, color:C },
            { label:'Transaksi', value:`${totalTx}x`, icon:ShoppingCart, color:'#3B82F6' },
            { label:'Rata-rata', value:fmt(avgTx), icon:DollarSign, color:'#8B5CF6' },
          ].map(kpi => (
            <div key={kpi.label} style={{ backgroundColor:'#fff', borderRadius:14, padding:16, boxShadow:'0 2px 12px rgba(5,150,105,.08)', textAlign:'center' }}>
              <div style={{ width:36, height:36, borderRadius:10, backgroundColor:`${kpi.color}15`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
                <kpi.icon size={16} style={{ color:kpi.color }}/>
              </div>
              <p style={{ fontSize:16, fontWeight:800, color:'#064E3B', margin:'0 0 3px' }}>{kpi.value}</p>
              <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Hourly Chart */}
        <div style={{ backgroundColor:'#fff', borderRadius:16, padding:20, marginBottom:16, boxShadow:'0 2px 12px rgba(5,150,105,.08)' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#064E3B', margin:'0 0 16px' }}>Penjualan per Jam</h3>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120 }}>
            {hourly.map(h => {
              const pct = maxRevenue > 0 ? (h.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={h.hour} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:10, color:'#6B7280', fontWeight:600 }}>{h.count}</span>
                  <div style={{ width:'100%', borderRadius:'4px 4px 0 0', backgroundColor:C, height:`${Math.max(pct, 4)}%`, transition:'height .3s', cursor:'pointer', position:'relative', minHeight:4 }}
                    title={`${h.hour}:00 — ${fmt(h.revenue)}`}/>
                  <span style={{ fontSize:10, color:'#9CA3AF' }}>{h.hour}</span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize:11, color:'#9CA3AF', margin:'8px 0 0', textAlign:'center' }}>Jam (angka di atas = jumlah transaksi)</p>
        </div>

        {/* Payment breakdown */}
        <div style={{ backgroundColor:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(5,150,105,.08)' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#064E3B', margin:'0 0 16px' }}>Breakdown Metode Pembayaran</h3>
          {methods.map(m => {
            const pct = totalRevenue > 0 ? (m.amount / totalRevenue) * 100 : 0;
            return (
              <div key={m.method} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:8, backgroundColor:`${m.color}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <m.icon size={13} style={{ color:m.color }}/>
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{m.method}</span>
                    <span style={{ fontSize:11, color:'#9CA3AF' }}>{m.count}x</span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#064E3B' }}>{fmt(m.amount)}</span>
                    <span style={{ fontSize:11, color:'#9CA3AF', marginLeft:6 }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ height:6, borderRadius:4, backgroundColor:'#F3F4F6', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, backgroundColor:m.color, width:`${pct}%`, transition:'width .5s' }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
