'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { FLEET_CONFIG, FLEET_NAV } from '../../../lib/nav-configs';
import { Fuel, Plus, X, Download, TrendingUp } from 'lucide-react';

const C = FLEET_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE_FUEL = [
  { id: 1, date: '2025-06-25', vehicle: 'B 1234 ABC — Toyota Avanza', driver: 'Agus Salim', qty: 40, price_per_liter: 10000, total: 400000, odometer: 45230, station: 'SPBU Pertamina Jl. Raya', km_per_liter: 12.5 },
  { id: 2, date: '2025-06-24', vehicle: 'B 5678 DEF — Isuzu Elf', driver: 'Budi Hartono', qty: 80, price_per_liter: 6800, total: 544000, odometer: 78450, station: 'SPBU Shell Jl. Sudirman', km_per_liter: 9.2 },
  { id: 3, date: '2025-06-23', vehicle: 'B 1234 ABC — Toyota Avanza', driver: 'Agus Salim', qty: 35, price_per_liter: 10000, total: 350000, odometer: 44720, station: 'SPBU Pertamina Jl. Raya', km_per_liter: 13.1 },
  { id: 4, date: '2025-06-22', vehicle: 'B 3456 JKL — Honda Beat', driver: 'Deni K.', qty: 5, price_per_liter: 10000, total: 50000, odometer: 12300, station: 'SPBU Pertamina Cabang', km_per_liter: 45.2 },
];

export default function FuelTrackingPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE_FUEL);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', vehicle: '', driver: '', qty: '', price_per_liter: '', odometer: '', station: '' });

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const totalLiters = items.reduce((s, i) => s + i.qty, 0);
  const totalCost = items.reduce((s, i) => s + i.total, 0);
  const avgKmPerLiter = items.reduce((s, i) => s + i.km_per_liter, 0) / items.length;

  const save = () => {
    if (!form.vehicle || !form.qty) return;
    const total = +form.qty * +form.price_per_liter;
    setItems(it => [{ id: it.length + 1, ...form, qty: +form.qty, price_per_liter: +form.price_per_liter, total, odometer: +form.odometer, km_per_liter: 0 }, ...it]);
    setShowForm(false);
    setForm({ date: '', vehicle: '', driver: '', qty: '', price_per_liter: '', odometer: '', station: '' });
  };

  return (
    <AppShell {...FLEET_CONFIG} navItems={FLEET_NAV} activeHref="/fleet/fuel-tracking">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Tracking BBM</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Pantau konsumsi dan biaya bahan bakar armada</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>
              <Download className="h-4 w-4" /> Export
            </button>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
              <Plus className="h-4 w-4" /> Input BBM
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total BBM (bulan ini)', value: `${totalLiters} Liter`, color: C },
            { label: 'Total Biaya BBM', value: fmt(totalCost), color: '#EA5455' },
            { label: 'Rata-rata Konsumsi', value: `${avgKmPerLiter.toFixed(1)} km/L`, color: '#4CAF50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Riwayat Pengisian BBM</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Tanggal', 'Kendaraan', 'Driver', 'Jumlah (L)', 'Harga/L', 'Total', 'Odometer', 'Km/L', 'SPBU'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 font-medium text-xs" style={{ color: '#1E1B4B' }}>{item.vehicle}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.driver}</td>
                    <td className="px-4 py-3 font-bold text-sm text-center" style={{ color: C }}>{item.qty}L</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{fmt(item.price_per_liter)}</td>
                    <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#1E1B4B' }}>{fmt(item.total)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.odometer.toLocaleString('id-ID')} km</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" style={{ color: item.km_per_liter > 20 ? '#4CAF50' : '#FF9800' }} />
                        <span className="text-xs font-semibold" style={{ color: item.km_per_liter > 20 ? '#4CAF50' : '#FF9800' }}>{item.km_per_liter}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.station}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Input Pengisian BBM</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'date', label: 'Tanggal *', type: 'date' },
                  { key: 'vehicle', label: 'Kendaraan *', placeholder: 'Pilih kendaraan...' },
                  { key: 'driver', label: 'Driver', placeholder: 'Nama driver...' },
                  { key: 'qty', label: 'Jumlah Liter', placeholder: '0', type: 'number' },
                  { key: 'price_per_liter', label: 'Harga per Liter (Rp)', placeholder: '10000', type: 'number' },
                  { key: 'odometer', label: 'Odometer saat ini (km)', placeholder: '0', type: 'number' },
                  { key: 'station', label: 'SPBU / Tempat Pengisian', placeholder: 'Nama SPBU...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={(f as any).placeholder ?? ''} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                {form.qty && form.price_per_liter && (
                  <div className="rounded-xl p-3" style={{ backgroundColor: `${C}08`, border: `1px solid ${C}30` }}>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Total Biaya:</p>
                    <p className="font-bold" style={{ color: C }}>{fmt(+form.qty * +form.price_per_liter)}</p>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <Fuel className="h-4 w-4" /> Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
