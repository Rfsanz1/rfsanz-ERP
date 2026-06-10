'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { PAYROLL_CONFIG, PAYROLL_NAV } from '../../../../lib/nav-configs';
import { Landmark, Download, Check, FileText } from 'lucide-react';

const C = PAYROLL_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const BANK_LIST = ['BCA', 'Mandiri', 'BRI', 'BNI', 'BTN'];

const SAMPLE = [
  { id: 1, name: 'Ahmad Fauzi', bank: 'BCA', account: '1234567890', account_name: 'Ahmad Fauzi', amount: 5900000, dept: 'Operasional', selected: true },
  { id: 2, name: 'Siti Rahayu', bank: 'Mandiri', account: '0987654321', account_name: 'Siti Rahayu', amount: 7080000, dept: 'Keuangan', selected: true },
  { id: 3, name: 'Budi Hartono', bank: 'BRI', account: '5678901234', account_name: 'Budi Hartono', amount: 5185000, dept: 'Operasional', selected: true },
  { id: 4, name: 'Hendra W.', bank: 'BCA', account: '2345678901', account_name: 'Hendra Wijaya', amount: 6490000, dept: 'Sales', selected: true },
  { id: 5, name: 'Rina Wati', bank: 'BNI', account: '3456789012', account_name: 'Rina Wati', amount: 6136000, dept: 'SDM', selected: true },
];

export default function BankExportPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [employees, setEmployees] = useState(SAMPLE);
  const [period, setPeriod] = useState('Juni 2025');
  const [selectedBank, setSelectedBank] = useState('Semua Bank');
  const [exported, setExported] = useState(false);

  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;

  const toggleSelect = (id: number) => setEmployees(es => es.map(e => e.id === id ? { ...e, selected: !e.selected } : e));

  const filtered = employees.filter(e => selectedBank === 'Semua Bank' || e.bank === selectedBank);
  const selected = filtered.filter(e => e.selected);
  const totalAmount = selected.reduce((s, e) => s + e.amount, 0);

  const byBank = BANK_LIST.map(bank => ({
    bank,
    count: employees.filter(e => e.bank === bank && e.selected).length,
    total: employees.filter(e => e.bank === bank && e.selected).reduce((s, e) => s + e.amount, 0),
  })).filter(b => b.count > 0);

  return (
    <AppShell {...PAYROLL_CONFIG} navItems={PAYROLL_NAV} activeHref="/hr/payrolls/bank-export">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Export ke Bank</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Generate file transfer bank untuk pembayaran gaji karyawan</p>
          </div>
          <div className="flex gap-2">
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={period} onChange={e => setPeriod(e.target.value)}>
              {['Juni 2025', 'Mei 2025', 'April 2025'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={() => setExported(true)} disabled={selected.length === 0} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: C }}>
              <Download className="h-4 w-4" /> Export File Bank
            </button>
          </div>
        </div>

        {exported && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(76,175,80,.08)', border: '1.5px solid rgba(76,175,80,.3)' }}>
            <Check className="h-5 w-5 flex-shrink-0" style={{ color: '#4CAF50' }} />
            <p className="text-sm" style={{ color: '#388E3C' }}>
              File transfer bank berhasil digenerate untuk <span className="font-bold">{selected.length} karyawan</span> dengan total <span className="font-bold">{fmt(totalAmount)}</span>.
            </p>
            <div className="ml-auto flex gap-2">
              {byBank.map(b => (
                <button key={b.bank} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(76,175,80,.15)', color: '#388E3C' }}>
                  <FileText className="h-3 w-3" /> {b.bank}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {byBank.map(b => (
            <div key={b.bank} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="h-4 w-4" style={{ color: C }} />
                <p className="font-bold" style={{ color: '#1E1B4B' }}>{b.bank}</p>
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{b.count} karyawan</p>
              <p className="font-bold mt-1" style={{ color: C }}>{fmt(b.total)}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Daftar Transfer — {period}</h3>
            <div className="flex gap-2 items-center">
              <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                <option value="Semua Bank">Semua Bank</option>
                {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['', 'Karyawan', 'Departemen', 'Bank', 'No. Rekening', 'Nama Rekening', 'Jumlah Transfer'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={emp.selected} onChange={() => toggleSelect(emp.id)} style={{ accentColor: C }} />
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: emp.selected ? '#1E1B4B' : '#9CA3AF' }}>{emp.name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{emp.dept}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${C}15`, color: C }}>{emp.bank}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#1E1B4B' }}>{emp.account}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#1E1B4B' }}>{emp.account_name}</td>
                    <td className="px-4 py-3 font-bold text-sm" style={{ color: emp.selected ? C : '#9CA3AF' }}>{fmt(emp.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  <td colSpan={6} className="px-4 py-3 font-bold text-sm" style={{ color: '#1E1B4B' }}>TOTAL ({selected.filter(e => selectedBank === 'Semua Bank' || e.bank === selectedBank).length} karyawan)</td>
                  <td className="px-4 py-3 font-bold text-sm" style={{ color: C }}>{fmt(totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
