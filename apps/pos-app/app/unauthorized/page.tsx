'use client';
import { useRouter } from 'next/navigation';
import { ShieldX, LogIn, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#F9FAFB', padding:24 }}>
      <div style={{ maxWidth:420, width:'100%', textAlign:'center' }}>
        <div style={{ width:80, height:80, borderRadius:'50%', backgroundColor:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
          <ShieldX size={36} style={{ color:'#DC2626' }} />
        </div>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#1E1B4B', margin:'0 0 10px' }}>Akses Ditolak</h1>
        <p style={{ fontSize:14, color:'#6B7280', lineHeight:1.6, margin:'0 0 32px' }}>
          Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator untuk mendapatkan akses yang sesuai dengan peran Anda.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => router.back()} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, border:'1.5px solid #E5E7EB', background:'#fff', color:'#374151', fontSize:13.5, fontWeight:600, cursor:'pointer' }}>
            <ArrowLeft size={15} /> Kembali
          </button>
          <button onClick={() => router.push('/login')} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, background:'linear-gradient(135deg,#5B52D1,#8B80F9)', border:'none', color:'#fff', fontSize:13.5, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 16px rgba(91,82,209,.35)' }}>
            <LogIn size={15} /> Login Ulang
          </button>
        </div>
      </div>
    </div>
  );
}
