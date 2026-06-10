'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/useAuthStore';
import api from '../../lib/api';
import { ArrowLeft, Plus, Clock, DollarSign, CheckCircle, ChevronRight, X } from 'lucide-react';

const C = '#059669';
const CLT = '#ECFDF5';

interface Session {
  id: string; openedAt: string; closedAt?: string; cashierName: string;
  openingCash: number; closingCash?: number; totalTransactions: number; totalRevenue: number;
  status: 'active' | 'closed';
}

const DEMO_SESSIONS: Session[] = [
  { id:'SES-001', openedAt:'2026-05-28T08:00:00', cashierName:'Budi Santoso', openingCash:500000, closingCash:2850000, totalTransactions:34, totalRevenue:2350000, status:'closed' },
  { id:'SES-002', openedAt:'2026-05-27T08:15:00', closedAt:'2026-05-27T17:00:00', cashierName:'Siti Rahayu', openingCash:500000, closingCash:3120000, totalTransactions:41, totalRevenue:2620000, status:'closed' },
  { id:'SES-003', openedAt:'2026-05-26T08:00:00', closedAt:'2026-05-26T16:30:00', cashierName:'Ahmad Fauzi', openingCash:500000, closingCash:1980000, totalTransactions:28, totalRevenue:1480000, status:'closed' },
];

export default function SessionsPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>(DEMO_SESSIONS);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('500000');

  useEffect(() => {
    if (!token) { router.replace('/login'); return; }
    const load = async () => {
      try {
        const [sesRes, activeRes] = await Promise.all([
          api.get('/pos/sessions'),
          api.get('/pos/sessions/active'),
        ]);
        if (sesRes.data) setSessions(sesRes.data);
        if (activeRes.data) setActiveSession(activeRes.data);
      } catch { }
      setLoading(false);
    };
    load();
  }, [token]);

  const openSession = async () => {
    try {
      const res = await api.post('/pos/sessions', { openingCash: parseInt(openingCash) });
      setActiveSession(res.data);
    } catch {
      const fake: Session = { id:`SES-${Date.now()}`, openedAt:new Date().toISOString(), cashierName:user?.name??'Kasir', openingCash:parseInt(openingCash), totalTransactions:0, totalRevenue:0, status:'active' };
      setActiveSession(fake);
    }
    setShowNewModal(false);
    router.push('/');
  };

  const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
  const fmtDate = (d: string) => new Date(d).toLocaleString('id-ID', { dateStyle:'medium', timeStyle:'short' });

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#F0FDF4' }}>
      <svg style={{ width:28, height:28, animation:'spin .8s linear infinite', color:C }} viewBox="0 0 24 24" fill="none">
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        <circle opacity=".2" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
        <path opacity=".8" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"/>
      </svg>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#F0FDF4', fontFamily:'Inter,sans-serif' }}>
      <header style={{ background:`linear-gradient(135deg,#047857,${C})`, padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={() => router.push('/')} style={{ padding:8, border:'none', background:'rgba(255,255,255,.15)', borderRadius:8, cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={18}/></button>
        <h1 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0, flex:1 }}>Kelola Sesi Kasir</h1>
        <button onClick={() => setShowNewModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', border:'none', borderRadius:10, background:'rgba(255,255,255,.2)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          <Plus size={14}/> Buka Sesi
        </button>
      </header>

      <div style={{ padding:16, maxWidth:640, margin:'0 auto' }}>
        {/* Active session */}
        {activeSession ? (
          <div style={{ backgroundColor:'#fff', borderRadius:16, padding:20, marginBottom:16, border:`2px solid ${C}`, boxShadow:`0 4px 20px ${C}20` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', backgroundColor:C, boxShadow:`0 0 8px ${C}` }}/>
                <span style={{ fontSize:13, fontWeight:700, color:'#064E3B' }}>Sesi Aktif</span>
              </div>
              <span style={{ fontSize:11, color:'#6B7280' }}>Dibuka: {fmtDate(activeSession.openedAt)}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
              {[
                { label:'Kas Awal', value:fmt(activeSession.openingCash), icon:DollarSign },
                { label:'Transaksi', value:activeSession.totalTransactions.toString(), icon:CheckCircle },
                { label:'Omzet', value:fmt(activeSession.totalRevenue), icon:DollarSign },
              ].map(s => (
                <div key={s.label} style={{ backgroundColor:CLT, borderRadius:12, padding:'10px 12px' }}>
                  <p style={{ fontSize:10.5, color:'#6B7280', margin:'0 0 4px' }}>{s.label}</p>
                  <p style={{ fontSize:13, fontWeight:700, color:'#064E3B', margin:0 }}>{s.value}</p>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => router.push('/')} style={{ flex:1, padding:'11px', borderRadius:12, border:'none', background:`linear-gradient(135deg,#047857,${C})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Lanjut Kasir →</button>
              <button onClick={() => router.push(`/sessions/${activeSession.id}`)} style={{ flex:1, padding:'11px', borderRadius:12, border:`2px solid ${C}`, background:'#fff', color:C, fontSize:13, fontWeight:600, cursor:'pointer' }}>Tutup Sesi</button>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor:'#fff', borderRadius:16, padding:24, marginBottom:16, textAlign:'center', border:`2px dashed ${C}40` }}>
            <Clock size={36} style={{ color:C, margin:'0 auto 12px', display:'block' }}/>
            <p style={{ fontSize:14, fontWeight:700, color:'#064E3B', margin:'0 0 6px' }}>Belum ada sesi aktif</p>
            <p style={{ fontSize:13, color:'#6B7280', margin:'0 0 16px' }}>Buka sesi baru untuk mulai menerima transaksi</p>
            <button onClick={() => setShowNewModal(true)} style={{ padding:'11px 24px', borderRadius:12, border:'none', background:`linear-gradient(135deg,#047857,${C})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Buka Sesi Baru</button>
          </div>
        )}

        {/* Session history */}
        <h2 style={{ fontSize:14, fontWeight:700, color:'#064E3B', margin:'0 0 12px' }}>Riwayat Sesi</h2>
        <div style={{ backgroundColor:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(5,150,105,.08)' }}>
          {sessions.map((s, i) => (
            <button key={s.id} onClick={() => router.push(`/sessions/${s.id}`)}
              style={{ width:'100%', padding:'16px 20px', border:'none', background:'transparent', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:14, borderBottom: i<sessions.length-1 ? `1px solid ${CLT}` : 'none' }}>
              <div style={{ width:40, height:40, borderRadius:12, backgroundColor:CLT, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <CheckCircle size={18} style={{ color:C }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#064E3B' }}>{s.id}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C }}>{fmt(s.totalRevenue)}</span>
                </div>
                <p style={{ fontSize:11.5, color:'#6B7280', margin:0 }}>{s.cashierName} · {fmtDate(s.openedAt)} · {s.totalTransactions} transaksi</p>
              </div>
              <ChevronRight size={16} style={{ color:'#C4C9D4' }}/>
            </button>
          ))}
        </div>
      </div>

      {/* New Session Modal */}
      {showNewModal && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:20 }}>
          <div style={{ backgroundColor:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:380, boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#064E3B', margin:0 }}>Buka Sesi Baru</h3>
              <button onClick={() => setShowNewModal(false)} style={{ border:'none', background:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={20}/></button>
            </div>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:'#374151', marginBottom:8 }}>Kas Awal (Rp)</label>
            <input type="number" value={openingCash} onChange={e => setOpeningCash(e.target.value)}
              style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:`1.5px solid ${CLT}`, outline:'none', fontSize:14, fontWeight:700, boxSizing:'border-box', marginBottom:20 }}/>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowNewModal(false)} style={{ flex:1, padding:'12px', borderRadius:12, border:'1.5px solid #E5E7EB', background:'#fff', color:'#6B7280', fontSize:13, fontWeight:600, cursor:'pointer' }}>Batal</button>
              <button onClick={openSession} style={{ flex:2, padding:'12px', borderRadius:12, border:'none', background:`linear-gradient(135deg,#047857,${C})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Buka & Mulai Kasir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
