'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/useAuthStore';
import api from '../../lib/api';
import { ArrowLeft, Search, Filter, Receipt, CreditCard, Banknote, Smartphone, Eye } from 'lucide-react';

const C = '#059669';
const CLT = '#ECFDF5';

interface Order {
  id: string; createdAt: string; cashierName: string; items: number;
  total: number; paymentMethod: string; status: string;
}

const DEMO_ORDERS: Order[] = [
  { id:'TRX-001', createdAt:'2026-05-28T09:15:00', cashierName:'Budi', items:5, total:285000, paymentMethod:'cash', status:'paid' },
  { id:'TRX-002', createdAt:'2026-05-28T10:30:00', cashierName:'Siti', items:3, total:175000, paymentMethod:'transfer', status:'paid' },
  { id:'TRX-003', createdAt:'2026-05-28T11:45:00', cashierName:'Budi', items:8, total:420000, paymentMethod:'card', status:'paid' },
  { id:'TRX-004', createdAt:'2026-05-28T13:00:00', cashierName:'Ahmad', items:2, total:95000, paymentMethod:'qris', status:'paid' },
  { id:'TRX-005', createdAt:'2026-05-28T14:20:00', cashierName:'Siti', items:6, total:315000, paymentMethod:'cash', status:'paid' },
  { id:'TRX-006', createdAt:'2026-05-27T09:00:00', cashierName:'Budi', items:4, total:210000, paymentMethod:'cash', status:'paid' },
  { id:'TRX-007', createdAt:'2026-05-27T11:00:00', cashierName:'Ahmad', items:7, total:385000, paymentMethod:'transfer', status:'paid' },
];

const METHOD_ICON = { cash: Banknote, transfer: Smartphone, card: CreditCard, qris: Receipt };
const METHOD_LABEL = { cash:'Tunai', transfer:'Transfer', card:'Kartu', qris:'QRIS' };
const METHOD_COLOR = { cash:'#059669', transfer:'#3B82F6', card:'#8B5CF6', qris:'#F59E0B' };

export default function OrdersPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterDate, setFilterDate] = useState('today');

  useEffect(() => {
    if (!token) { router.replace('/login'); return; }
    api.get('/pos/transactions').then(r => { if (r.data?.length) setOrders(r.data); }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.cashierName.toLowerCase().includes(search.toLowerCase());
    const matchMethod = filterMethod === 'all' || o.paymentMethod === filterMethod;
    return matchSearch && matchMethod;
  });

  const todayTotal = orders.filter(o => o.createdAt.startsWith('2026-05-28')).reduce((s, o) => s + o.total, 0);
  const todayCount = orders.filter(o => o.createdAt.startsWith('2026-05-28')).length;

  const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
  const fmtTime = (d: string) => new Date(d).toLocaleString('id-ID', { dateStyle:'short', timeStyle:'short' });

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#F0FDF4', fontFamily:'Inter,sans-serif' }}>
      <header style={{ background:`linear-gradient(135deg,#047857,${C})`, padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={() => router.push('/')} style={{ padding:8, border:'none', background:'rgba(255,255,255,.15)', borderRadius:8, cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={18}/></button>
        <h1 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0, flex:1 }}>Riwayat Transaksi</h1>
      </header>

      <div style={{ padding:16, maxWidth:720, margin:'0 auto' }}>
        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <div style={{ backgroundColor:'#fff', borderRadius:14, padding:16, boxShadow:'0 2px 12px rgba(5,150,105,.08)' }}>
            <p style={{ fontSize:11, color:'#9CA3AF', margin:'0 0 6px' }}>OMZET HARI INI</p>
            <p style={{ fontSize:18, fontWeight:800, color:'#064E3B', margin:0 }}>{fmt(todayTotal)}</p>
          </div>
          <div style={{ backgroundColor:'#fff', borderRadius:14, padding:16, boxShadow:'0 2px 12px rgba(5,150,105,.08)' }}>
            <p style={{ fontSize:11, color:'#9CA3AF', margin:'0 0 6px' }}>JUMLAH TRANSAKSI</p>
            <p style={{ fontSize:18, fontWeight:800, color:'#064E3B', margin:0 }}>{todayCount} transaksi</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <div style={{ position:'relative', flex:1 }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari ID atau kasir…"
              style={{ width:'100%', padding:'9px 12px 9px 30px', borderRadius:10, border:`1.5px solid ${CLT}`, outline:'none', fontSize:13, backgroundColor:'#fff', boxSizing:'border-box' }}/>
          </div>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
            style={{ padding:'9px 12px', borderRadius:10, border:`1.5px solid ${CLT}`, outline:'none', fontSize:13, backgroundColor:'#fff', color:'#374151', cursor:'pointer' }}>
            <option value="all">Semua Metode</option>
            <option value="cash">Tunai</option>
            <option value="transfer">Transfer</option>
            <option value="card">Kartu</option>
            <option value="qris">QRIS</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ backgroundColor:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(5,150,105,.08)' }}>
          <div style={{ padding:'12px 20px', borderBottom:`1px solid ${CLT}`, display:'grid', gridTemplateColumns:'1fr 1fr 80px 100px 80px', gap:8 }}>
            {['ID Transaksi','Waktu','Item','Total','Metode'].map(h => (
              <span key={h} style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase' }}>{h}</span>
            ))}
          </div>
          {filtered.map((o, i) => {
            const Icon = METHOD_ICON[o.paymentMethod as keyof typeof METHOD_ICON] ?? Receipt;
            const color = METHOD_COLOR[o.paymentMethod as keyof typeof METHOD_COLOR] ?? C;
            return (
              <div key={o.id} style={{ padding:'12px 20px', borderBottom: i<filtered.length-1 ? `1px solid ${CLT}` : 'none', display:'grid', gridTemplateColumns:'1fr 1fr 80px 100px 80px', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#064E3B' }}>{o.id}</span>
                <span style={{ fontSize:12, color:'#6B7280' }}>{fmtTime(o.createdAt)}</span>
                <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>{o.items} item</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#064E3B' }}>{fmt(o.total)}</span>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <Icon size={12} style={{ color }}/>
                  <span style={{ fontSize:11, fontWeight:600, color }}>{METHOD_LABEL[o.paymentMethod as keyof typeof METHOD_LABEL]}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Tidak ada transaksi ditemukan</div>
          )}
        </div>
      </div>
    </div>
  );
}
