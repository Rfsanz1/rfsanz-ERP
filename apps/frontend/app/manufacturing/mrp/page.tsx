'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { MANUFACTURING_CONFIG, MANUFACTURING_NAV } from '../../../lib/nav-configs';
import { Target, RefreshCw, AlertTriangle, Package, ShoppingCart, Check } from 'lucide-react';

const C = MANUFACTURING_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const MRP_RESULTS = [
  { product: 'Bahan Baku A (PP Grade)', current_stock: 250, required: 500, to_purchase: 250, unit: 'kg', status: 'shortage', urgency: 'high', supplier: 'PT. Supplier Utama', est_cost: 11250000 },
  { product: 'Bahan Baku B (Resin)', current_stock: 1200, required: 800, to_purchase: 0, unit: 'kg', status: 'sufficient', urgency: 'none', supplier: '-', est_cost: 0 },
  { product: 'Kemasan Karton 20L', current_stock: 500, required: 1000, to_purchase: 600, unit: 'pcs', status: 'shortage', urgency: 'medium', supplier: 'CV. Kemasan Jaya', est_cost: 6000000 },
  { product: 'Label Produk', current_stock: 800, required: 1000, to_purchase: 300, unit: 'lembar', status: 'shortage', urgency: 'low', supplier: 'Percetakan ABC', est_cost: 450000 },
  { product: 'Tutup Botol', current_stock: 2000, required: 1000, to_purchase: 0, unit: 'pcs', status: 'sufficient', urgency: 'none', supplier: '-', est_cost: 0 },
];

const URGENCY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: 'Mendesak',  color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
  medium: { label: 'Sedang',   color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  low:    { label: 'Rendah',   color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  none:   { label: 'Aman',     color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
};

export default function MRPPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState('2025-06-25 08:30');
  const [results, setResults] = useState(MRP_RESULTS);

  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;

  const runMRP = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setLastRun(new Date().toLocaleString('id-ID'));
    }, 2000);
  };

  const shortages = results.filter(r => r.status === 'shortage');
  const totalCost = shortages.reduce((s, r) => s + r.est_cost, 0);

  return (
    <AppShell {...MANUFACTURING_CONFIG} navItems={MANUFACTURING_NAV} activeHref="/manufacturing/mrp">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Material Requirements Planning (MRP)</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Perencanaan kebutuhan material berdasarkan rencana produksi</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Terakhir dijalankan: {lastRun}</p>
            <button onClick={runMRP} disabled={running} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
              {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              {running ? 'Menghitung...' : 'Jalankan MRP'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Material Kekurangan', value: shortages.length, color: '#EA5455' },
            { label: 'Material Cukup', value: results.filter(r => r.status === 'sufficient').length, color: '#4CAF50' },
            { label: 'Perlu Dibeli', value: shortages.length, color: '#FF9800' },
            { label: 'Est. Biaya Pembelian', value: fmt(totalCost), color: C },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-xl font-bold mt-1 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {shortages.length > 0 && (
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(234,84,85,.06)', border: '1.5px solid rgba(234,84,85,.2)' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#EA5455' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#C62828' }}>Terdapat {shortages.length} material kekurangan</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Buat Purchase Order segera untuk material yang kekurangan agar produksi tidak terhambat.</p>
            </div>
            <button className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: '#EA5455', color: '#FFFFFF' }}>
              <ShoppingCart className="h-3.5 w-3.5" /> Buat PO Otomatis
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Hasil Perhitungan MRP</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Material', 'Stok Saat Ini', 'Kebutuhan', 'Perlu Dibeli', 'Satuan', 'Supplier', 'Est. Biaya', 'Urgensi', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const urg = URGENCY_MAP[r.urgency];
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>
                        <div className="flex items-center gap-2">
                          {r.status === 'shortage' && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#EA5455' }} />}
                          {r.status === 'sufficient' && <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#4CAF50' }} />}
                          {r.product}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center" style={{ color: r.current_stock < r.required ? '#EA5455' : '#4CAF50' }}>
                        <span className="font-semibold">{r.current_stock}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold" style={{ color: '#1E1B4B' }}>{r.required}</td>
                      <td className="px-4 py-3 text-center font-bold" style={{ color: r.to_purchase > 0 ? '#EA5455' : '#4CAF50' }}>
                        {r.to_purchase > 0 ? r.to_purchase : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{r.unit}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{r.supplier}</td>
                      <td className="px-4 py-3 font-semibold text-xs" style={{ color: C }}>{r.est_cost > 0 ? fmt(r.est_cost) : '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: urg.color, backgroundColor: urg.bg }}>{urg.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.to_purchase > 0 && (
                          <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: `${C}15`, color: C }}>
                            Buat PO
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
