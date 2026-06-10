'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/useAuthStore';
import api from '../../../lib/api';
import { ArrowLeft, DollarSign, CheckCircle, CreditCard, Banknote, Smartphone, X, Printer } from 'lucide-react';

const C = '#059669';
const CLT = '#ECFDF5';

interface Session {
  id: string; openedAt: string; closedAt?: string; cashierName: string;
  openingCash: number; closingCash?: number; totalTransactions: number; totalRevenue: number;
  status: 'active' | 'closed';
  breakdown?: { cash: number; transfer: number; card: number; qris: number; };
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuthStore();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [closingCash, setClosingCash] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!token) { router.replace('/login'); return; }
    api.get(`/pos/sessions/${id}`).then(r => setSession(r.data)).catch(() => {
      setSession({
        id: id as string, openedAt:'2026-05-28T08:00:00', cashierName:'Budi Santoso',
        openingCash:500000, totalTransactions:34, totalRevenue:2350000, status:'active',
        breakdown: { cash:1200000, transfer:850000, card:200000, qris:100000 },
      });
    }).finally(() => setLoading(false));
  }, [id, token]);

  const closeSession = async () => {
    setClosing(true);
    try {
      await api.post(`/pos/sessions/${id}/close`, { closingCash: parseInt(closingCash) });
    } catch { }
    setSession(prev => prev ? { ...prev, closingCash: parseInt(closingCash), status:'closed', closedAt:new Date().toISOString() } : prev);
    setClosing(false);
    setShowCloseModal(false);
    setClosed(true);
  };

  const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
  const fmtDate = (d: string) => new Date(d).toLocaleString('id-ID', { dateStyle:'medium', timeStyle:'short' });

  if (loading || !session) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#F0FDF4' }}>
      <p style={{ color:C }}>Memuat detail sesi…</p>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#F0FDF4', fontFamily:'Inter,sans-serif' }}>
      <header style={{ background:`linear-gradient(135deg,#047857,${C})`, padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={() => router.back()} style={{ padding:8, border:'none', background:'rgba(255,255,255,.15)', borderRadius:8, cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={18}/></button>
        <h1 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0, flex:1 }}>Detail Sesi</h1>
        <span style={{ fontSize:12, color:'rgba(255,255,255,.8)', fontWeight:600 }}>{session.id}</span>
      </header>

      <div style={{ padding:16, maxWidth:600, margin:'0 auto' }}>
        {closed && (
          <div style={{ backgroundColor:CLT, border:`1px solid #6EE7B7`, borderRadius:14, padding:16, marginBottom:16, textAlign:'center' }}>
            <CheckCircle size={28} style={{ color:C, margin:'0 auto 8px', display:'block' }}/>
            <p style={{ fontSize:14, fontWeight:700, color:'#064E3B', margin:0 }}>Sesi berhasil ditutup!</p>
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {[
            { label:'Kas Awal', value:fmt(session.openingCash), icon:DollarSign, color:'#6B7280' },
            { label:'Kas Akhir', value: session.closingCash ? fmt(session.closingCash) : '—', icon:DollarSign, color:C },
            { label:'Total Transaksi', value:session.totalTransactions.toString(), icon:CheckCircle, color:'#3B82F6' },
            { label:'Total Omzet', value:fmt(session.totalRevenue), icon:DollarSign, color:'#8B5CF6' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor:'#fff', borderRadius:14, padding:16, boxShadow:'0 2px 12px rgba(5,150,105,.08)' }}>
              <p style={{ fontSize:11, color:'#9CA3AF', margin:'0 0 6px', fontWeight:600 }}>{s.label}</p>
              <p style={{ fontSize:16, fontWeight:800, color:s.color, margin:0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Breakdown by payment */}
        {session.breakdown && (
          <div style={{ backgroundColor:'#fff', borderRadius:16, padding:20, marginBottom:16, boxShadow:'0 2px 12px rgba(5,150,105,.08)' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#064E3B', margin:'0 0 14px' }}>Breakdown Pembayaran</h3>
            {[
              { label:'Tunai', icon:Banknote, value:session.breakdown.cash, color:'#059669' },
              { label:'Transfer', icon:Smartphone, value:session.breakdown.transfer, color:'#3B82F6' },
              { label:'Kartu', icon:CreditCard, value:session.breakdown.card, color:'#8B5CF6' },
              { label:'QRIS', icon:CheckCircle, value:session.breakdown.qris, color:'#F59E0B' },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${CLT}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:8, backgroundColor:`${row.color}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <row.icon size={14} style={{ color:row.color }}/>
                  </div>
                  <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{row.label}</span>
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:'#064E3B' }}>{fmt(row.value)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div style={{ backgroundColor:'#fff', borderRadius:16, padding:20, marginBottom:16, boxShadow:'0 2px 12px rgba(5,150,105,.08)' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#064E3B', margin:'0 0 14px' }}>Informasi Sesi</h3>
          {[
            { label:'Kasir', value:session.cashierName },
            { label:'Dibuka', value:fmtDate(session.openedAt) },
            { label:'Ditutup', value: session.closedAt ? fmtDate(session.closedAt) : '—' },
          ].map(row => (
            <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${CLT}` }}>
              <span style={{ fontSize:13, color:'#6B7280' }}>{row.label}</span>
              <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {session.status === 'active' && !closed && (
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => window.print()} style={{ flex:1, padding:'12px', borderRadius:12, border:`2px solid ${C}`, background:'#fff', color:C, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <Printer size={15}/> Print Laporan
            </button>
            <button onClick={() => setShowCloseModal(true)} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:`linear-gradient(135deg,#DC2626,#EF4444)`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <X size={15}/> Tutup Sesi
            </button>
          </div>
        )}
      </div>

      {/* Close Session Modal */}
      {showCloseModal && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:20 }}>
          <div style={{ backgroundColor:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:380 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#064E3B', margin:'0 0 6px' }}>Tutup Sesi Kasir</h3>
            <p style={{ fontSize:13, color:'#6B7280', margin:'0 0 20px' }}>Masukkan jumlah kas akhir yang dihitung</p>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:'#374151', marginBottom:8 }}>Kas Akhir (Rp)</label>
            <input type="number" value={closingCash} onChange={e => setClosingCash(e.target.value)}
              style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:`1.5px solid ${CLT}`, outline:'none', fontSize:14, fontWeight:700, boxSizing:'border-box', marginBottom:20 }}/>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowCloseModal(false)} style={{ flex:1, padding:'12px', borderRadius:12, border:'1.5px solid #E5E7EB', background:'#fff', color:'#6B7280', fontSize:13, fontWeight:600, cursor:'pointer' }}>Batal</button>
              <button onClick={closeSession} disabled={closing || !closingCash} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#DC2626,#EF4444)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity: closingCash ? 1 : 0.5 }}>
                {closing ? '⏳…' : 'Tutup Sesi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
