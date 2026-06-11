'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { Globe, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

const C = ACCOUNTING_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CURRENCIES = [
  { code: 'IDR', name: 'Rupiah Indonesia', symbol: 'Rp', rate: 1, rate_prev: 1, is_base: true, last_update: '2025-06-25' },
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 15890, rate_prev: 15820, is_base: false, last_update: '2025-06-25' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 11650, rate_prev: 11680, is_base: false, last_update: '2025-06-25' },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 17200, rate_prev: 17050, is_base: false, last_update: '2025-06-25' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rate: 3420, rate_prev: 3450, is_base: false, last_update: '2025-06-25' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 2190, rate_prev: 2180, is_base: false, last_update: '2025-06-25' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 103, rate_prev: 104, is_base: false, last_update: '2025-06-25' },
];

export default function CurrenciesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [editRates, setEditRates] = useState<Record<string, string>>({});

  if (!token) return null;

  const updateRates = () => {
    setUpdating(true);
    setTimeout(() => setUpdating(false), 2000);
  };

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/currencies">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Multi Mata Uang</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola kurs valuta asing untuk transaksi multi-currency</p>
          </div>
          <button onClick={updateRates} disabled={updating} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            {updating ? 'Mengupdate...' : 'Auto Update Kurs'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {CURRENCIES.filter(c => !c.is_base).slice(0, 3).map(c => {
            const change = c.rate - c.rate_prev;
            const changePct = (change / c.rate_prev * 100).toFixed(2);
            const isUp = change > 0;
            return (
              <div key={c.code} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg" style={{ color: '#1E1B4B' }}>{c.code}</span>
                  <div className={`flex items-center gap-1 text-xs font-semibold`} style={{ color: isUp ? '#4CAF50' : '#EA5455' }}>
                    {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {isUp ? '+' : ''}{changePct}%
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: C }}>Rp {fmt(c.rate)}</p>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{c.name}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Tabel Kurs — {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Kode', 'Mata Uang', 'Simbol', 'Kurs (vs IDR)', 'Kurs Kemarin', 'Perubahan', 'Update Terakhir', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CURRENCIES.map(c => {
                  const change = c.rate - c.rate_prev;
                  const isUp = change > 0;
                  const isBase = c.is_base;
                  return (
                    <tr key={c.code} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold" style={{ color: C }}>
                        {c.code} {isBase && <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${C}15`, color: C }}>Base</span>}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{c.name}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: '#6B7280' }}>{c.symbol}</td>
                      <td className="px-4 py-3">
                        {!isBase ? (
                          editRates[c.code] !== undefined ? (
                            <input type="number" className="w-24 rounded px-2 py-1 text-sm font-bold" style={{ border: '1.5px solid' + C, outline: 'none', color: '#1E1B4B' }} value={editRates[c.code]} onChange={e => setEditRates(r => ({ ...r, [c.code]: e.target.value }))} />
                          ) : (
                            <span className="font-bold" style={{ color: '#1E1B4B' }}>Rp {fmt(c.rate)}</span>
                          )
                        ) : (
                          <span className="font-bold" style={{ color: '#4CAF50' }}>1.00 (Base)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{isBase ? '-' : `Rp ${fmt(c.rate_prev)}`}</td>
                      <td className="px-4 py-3">
                        {!isBase && (
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: isUp ? '#4CAF50' : '#EA5455' }}>
                            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {isUp ? '+' : ''}{fmt(change)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{c.last_update}</td>
                      <td className="px-4 py-3">
                        {!isBase && (
                          editRates[c.code] !== undefined ? (
                            <div className="flex gap-1.5">
                              <button onClick={() => setEditRates(r => { const n = { ...r }; delete n[c.code]; return n; })} className="text-xs font-semibold px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(76,175,80,.1)', color: '#388E3C' }}>Simpan</button>
                              <button onClick={() => setEditRates(r => { const n = { ...r }; delete n[c.code]; return n; })} className="text-xs font-semibold px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(158,158,158,.1)', color: '#6B7280' }}>Batal</button>
                            </div>
                          ) : (
                            <button onClick={() => setEditRates(r => ({ ...r, [c.code]: String(c.rate) }))} className="text-xs font-semibold" style={{ color: C }}>Edit</button>
                          )
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
