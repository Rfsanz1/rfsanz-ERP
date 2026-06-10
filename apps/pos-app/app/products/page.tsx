'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/useAuthStore';
import api from '../../lib/api';
import { ArrowLeft, Search, Edit2, Eye, EyeOff, Package, Save, X } from 'lucide-react';

const C = '#059669';
const CLT = '#ECFDF5';

interface Product {
  id: number; name: string; price: number; category: string; emoji: string;
  stock: number; posActive: boolean;
}

const DEMO_PRODUCTS: Product[] = [
  { id:1, name:'Semen Portland 40kg', price:50000, category:'Material', emoji:'🏗️', stock:200, posActive:true },
  { id:2, name:'Cat Tembok 5L', price:55000, category:'Cat', emoji:'🎨', stock:50, posActive:true },
  { id:3, name:'Pipa PVC 4"', price:25000, category:'Plumbing', emoji:'🚰', stock:80, posActive:true },
  { id:4, name:'Besi Beton 10mm', price:50000, category:'Besi', emoji:'⚙️', stock:150, posActive:true },
  { id:5, name:'Keramik 60x60', price:40000, category:'Keramik', emoji:'🪟', stock:300, posActive:true },
  { id:6, name:'Triplek 9mm', price:85000, category:'Kayu', emoji:'🌲', stock:40, posActive:false },
  { id:7, name:'Kabel NYM 2x1.5', price:15000, category:'Listrik', emoji:'⚡', stock:500, posActive:true },
  { id:8, name:'Genteng Beton', price:8000, category:'Atap', emoji:'🏠', stock:1000, posActive:false },
];

export default function ProductsPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const isSupervisor = user?.roles?.some(r => ['SUPERVISOR_KASIR','ADMIN','OWNER','SUPER_ADMIN'].includes(r));

  useEffect(() => {
    if (!token) { router.replace('/login'); return; }
    api.get('/pos/products').then(r => { if (r.data?.length) setProducts(r.data); }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const toggleActive = async (id: number) => {
    if (!isSupervisor) return;
    setProducts(prev => prev.map(p => p.id===id ? { ...p, posActive:!p.posActive } : p));
    try { await api.patch(`/pos/products/${id}`, { posActive: !products.find(p => p.id===id)?.posActive }); } catch {}
  };

  const savePrice = async () => {
    if (!editing) return;
    const newPrice = parseInt(editPrice);
    setProducts(prev => prev.map(p => p.id===editing.id ? { ...p, price:newPrice } : p));
    try { await api.patch(`/pos/products/${editing.id}`, { price:newPrice }); } catch {}
    setEditing(null);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#F0FDF4', fontFamily:'Inter,sans-serif' }}>
      <header style={{ background:`linear-gradient(135deg,#047857,${C})`, padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={() => router.push('/')} style={{ padding:8, border:'none', background:'rgba(255,255,255,.15)', borderRadius:8, cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={18}/></button>
        <h1 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0, flex:1 }}>Produk POS</h1>
        {isSupervisor && <span style={{ fontSize:11, backgroundColor:'rgba(255,255,255,.2)', color:'#fff', borderRadius:100, padding:'3px 10px', fontWeight:600 }}>Supervisor Mode</span>}
      </header>

      <div style={{ padding:16, maxWidth:720, margin:'0 auto' }}>
        {!isSupervisor && (
          <div style={{ backgroundColor:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:12, padding:'10px 14px', marginBottom:14, fontSize:12.5, color:'#92400E' }}>
            ⚠ Hanya Supervisor yang dapat mengubah harga dan status produk
          </div>
        )}

        <div style={{ position:'relative', marginBottom:14 }}>
          <Search size={13} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk…"
            style={{ width:'100%', padding:'10px 12px 10px 32px', borderRadius:12, border:`1.5px solid ${CLT}`, outline:'none', fontSize:13, backgroundColor:'#fff', boxSizing:'border-box' }}/>
        </div>

        <div style={{ backgroundColor:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(5,150,105,.08)' }}>
          <div style={{ padding:'12px 20px', borderBottom:`1px solid ${CLT}`, display:'grid', gridTemplateColumns:'2fr 1fr 80px 80px 60px', gap:8 }}>
            {['Produk','Kategori','Harga','Stok','Aktif'].map(h => (
              <span key={h} style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase' }}>{h}</span>
            ))}
          </div>
          {filtered.map((p, i) => (
            <div key={p.id} style={{ padding:'12px 20px', borderBottom: i<filtered.length-1 ? `1px solid ${CLT}` : 'none', display:'grid', gridTemplateColumns:'2fr 1fr 80px 80px 60px', gap:8, alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                <span style={{ fontSize:18 }}>{p.emoji}</span>
                <span style={{ fontSize:12.5, fontWeight:600, color:'#1E1B4B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
              </div>
              <span style={{ fontSize:12, backgroundColor:`${C}15`, color:C, borderRadius:6, padding:'2px 8px', fontWeight:600, width:'fit-content' }}>{p.category}</span>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:12.5, fontWeight:700, color:'#064E3B' }}>Rp {p.price.toLocaleString('id-ID')}</span>
                {isSupervisor && (
                  <button onClick={() => { setEditing(p); setEditPrice(p.price.toString()); }} style={{ border:'none', background:'none', cursor:'pointer', color:'#9CA3AF', padding:2 }}><Edit2 size={12}/></button>
                )}
              </div>
              <span style={{ fontSize:12.5, color:'#374151' }}>{p.stock}</span>
              <button onClick={() => toggleActive(p.id)} disabled={!isSupervisor}
                style={{ padding:6, borderRadius:8, border:'none', cursor: isSupervisor ? 'pointer' : 'default', backgroundColor: p.posActive ? CLT : '#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {p.posActive ? <Eye size={14} style={{ color:C }}/> : <EyeOff size={14} style={{ color:'#9CA3AF' }}/>}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Price Modal */}
      {editing && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:20 }}>
          <div style={{ backgroundColor:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:360 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#064E3B', margin:0 }}>Edit Harga</h3>
              <button onClick={() => setEditing(null)} style={{ border:'none', background:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={20}/></button>
            </div>
            <p style={{ fontSize:13, color:'#374151', margin:'0 0 16px' }}>{editing.emoji} {editing.name}</p>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:'#374151', marginBottom:8 }}>Harga Baru (Rp)</label>
            <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
              style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:`1.5px solid ${CLT}`, outline:'none', fontSize:14, fontWeight:700, boxSizing:'border-box', marginBottom:20 }}/>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setEditing(null)} style={{ flex:1, padding:'12px', borderRadius:12, border:'1.5px solid #E5E7EB', background:'#fff', color:'#6B7280', fontSize:13, fontWeight:600, cursor:'pointer' }}>Batal</button>
              <button onClick={savePrice} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:`linear-gradient(135deg,#047857,${C})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}><Save size={14}/> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
