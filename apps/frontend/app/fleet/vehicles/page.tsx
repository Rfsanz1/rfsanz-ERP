'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { FLEET_CONFIG, FLEET_NAV } from '../../../lib/nav-configs';
import { Car, Plus, Search, X, Bell, AlertTriangle, Fuel, Navigation } from 'lucide-react';

const C = FLEET_CONFIG.appColor;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: 'Aktif',       color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  maintenance: { label: 'Servis',      color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  idle:        { label: 'Menganggur',  color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  retired:     { label: 'Pensiun',     color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
};

const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE = [
  { id: 1, plate: 'B 1234 ABC', brand: 'Toyota', model: 'Avanza', year: 2021, type: 'Minibus', driver: 'Agus Salim', stnk_expire: '2025-08-15', kir_expire: '2025-07-30', last_fuel: '2025-06-24', fuel_qty: 40, odometer: 45230, status: 'active' },
  { id: 2, plate: 'B 5678 DEF', brand: 'Isuzu', model: 'Elf NMR', year: 2020, type: 'Pickup', driver: 'Budi Hartono', stnk_expire: '2025-12-01', kir_expire: '2025-09-15', last_fuel: '2025-06-23', fuel_qty: 80, odometer: 78450, status: 'active' },
  { id: 3, plate: 'B 9012 GHI', brand: 'Mitsubishi', model: 'Colt Diesel', year: 2019, type: 'Truk', driver: '-', stnk_expire: '2025-06-20', kir_expire: '2025-05-10', last_fuel: '2025-06-10', fuel_qty: 120, odometer: 123400, status: 'maintenance' },
  { id: 4, plate: 'B 3456 JKL', brand: 'Honda', model: 'Beat', year: 2022, type: 'Motor', driver: 'Deni K.', stnk_expire: '2026-03-15', kir_expire: '-', last_fuel: '2025-06-25', fuel_qty: 5, odometer: 12300, status: 'active' },
];

const today = new Date();
const isExpiringSoon = (dateStr: string) => {
  if (dateStr === '-') return false;
  const d = new Date(dateStr);
  const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 30 && diff >= 0;
};
const isExpired = (dateStr: string) => {
  if (dateStr === '-') return false;
  return new Date(dateStr) < today;
};

export default function FleetVehiclesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ plate: '', brand: '', model: '', year: '', type: '', driver: '', stnk_expire: '', kir_expire: '' });

  if (!token) return null;

  const filtered = items.filter(i =>
    (i.plate.toLowerCase().includes(search.toLowerCase()) || i.brand.toLowerCase().includes(search.toLowerCase()) || i.driver.toLowerCase().includes(search.toLowerCase())) &&
    (status === '' || i.status === status)
  );

  const expiringDoc = items.filter(i => isExpiringSoon(i.stnk_expire) || isExpiringSoon(i.kir_expire) || isExpired(i.stnk_expire) || isExpired(i.kir_expire)).length;

  const save = () => {
    if (!form.plate) return;
    setItems(it => [...it, { id: it.length + 1, ...form, year: +form.year, last_fuel: '-', fuel_qty: 0, odometer: 0, status: 'active' }]);
    setShowForm(false);
    setForm({ plate: '', brand: '', model: '', year: '', type: '', driver: '', stnk_expire: '', kir_expire: '' });
  };

  return (
    <AppShell {...FLEET_CONFIG} navItems={FLEET_NAV} activeHref="/fleet/vehicles">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Manajemen Armada</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola kendaraan, dokumen, dan penugasan driver</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Tambah Kendaraan
          </button>
        </div>

        {expiringDoc > 0 && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(255,152,0,.08)', border: '1.5px solid rgba(255,152,0,.3)' }}>
            <Bell className="h-5 w-5 flex-shrink-0" style={{ color: '#FF9800' }} />
            <p className="text-sm" style={{ color: '#E65100' }}>
              <span className="font-bold">{expiringDoc} kendaraan</span> memiliki dokumen (STNK/KIR) yang expired atau akan habis dalam 30 hari.
            </p>
            <button className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: '#FF9800', color: '#FFFFFF' }}>Lihat Reminder</button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Kendaraan', value: items.length, color: C },
            { label: 'Aktif', value: items.filter(i => i.status === 'active').length, color: '#4CAF50' },
            { label: 'Servis', value: items.filter(i => i.status === 'maintenance').length, color: '#FF9800' },
            { label: 'Dok. Perlu Diperbarui', value: expiringDoc, color: '#EA5455' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari plat, merek, atau driver..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Plat Nomor', 'Kendaraan', 'Tipe', 'Driver', 'STNK', 'KIR', 'BBM Terakhir', 'Odometer', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const s = STATUS_MAP[v.status];
                  const stnkExpired = isExpired(v.stnk_expire);
                  const stnkSoon = isExpiringSoon(v.stnk_expire);
                  const kirExpired = isExpired(v.kir_expire);
                  const kirSoon = isExpiringSoon(v.kir_expire);
                  return (
                    <tr key={v.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold" style={{ color: C }}>{v.plate}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: '#1E1B4B' }}>{v.brand} {v.model}</p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>{v.year}</p>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{v.type}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#1E1B4B' }}>{v.driver || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {(stnkExpired || stnkSoon) && <AlertTriangle className="h-3 w-3 flex-shrink-0" style={{ color: stnkExpired ? '#EA5455' : '#FF9800' }} />}
                          <span className="text-xs" style={{ color: stnkExpired ? '#EA5455' : stnkSoon ? '#FF9800' : '#1E1B4B' }}>
                            {v.stnk_expire !== '-' ? new Date(v.stnk_expire).toLocaleDateString('id-ID') : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {(kirExpired || kirSoon) && <AlertTriangle className="h-3 w-3 flex-shrink-0" style={{ color: kirExpired ? '#EA5455' : '#FF9800' }} />}
                          <span className="text-xs" style={{ color: kirExpired ? '#EA5455' : kirSoon ? '#FF9800' : '#1E1B4B' }}>
                            {v.kir_expire !== '-' ? new Date(v.kir_expire).toLocaleDateString('id-ID') : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}>
                          <Fuel className="h-3 w-3" />
                          {v.fuel_qty}L — {new Date(v.last_fuel).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#1E1B4B' }}>{v.odometer.toLocaleString('id-ID')} km</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-y-auto" style={{ maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Kendaraan</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'plate', label: 'Plat Nomor *', placeholder: 'B 1234 ABC' },
                    { key: 'brand', label: 'Merek', placeholder: 'Toyota, Isuzu...' },
                    { key: 'model', label: 'Model', placeholder: 'Avanza, Elf...' },
                    { key: 'year', label: 'Tahun', placeholder: '2021', type: 'number' },
                    { key: 'type', label: 'Tipe', placeholder: 'Minibus, Truk...' },
                    { key: 'driver', label: 'Driver', placeholder: 'Nama driver...' },
                    { key: 'stnk_expire', label: 'Kadaluarsa STNK', type: 'date' },
                    { key: 'kir_expire', label: 'Kadaluarsa KIR', type: 'date' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                      <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={(f as any).placeholder ?? ''} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <Car className="h-4 w-4" /> Simpan Kendaraan
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
