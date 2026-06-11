'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { PAYROLL_CONFIG, PAYROLL_NAV } from '../../../../lib/nav-configs';
import { Users, Play, Check, X, RefreshCw, Download, FileText } from 'lucide-react';

const C = PAYROLL_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE_EMPLOYEES = [
  { id: 1, name: 'Ahmad Fauzi', dept: 'Operasional', position: 'Staff', basic: 5000000, allowance: 1250000, deductions: 350000, net: 5900000, selected: true },
  { id: 2, name: 'Siti Rahayu', dept: 'Keuangan', position: 'Staff', basic: 6000000, allowance: 1500000, deductions: 420000, net: 7080000, selected: true },
  { id: 3, name: 'Budi Hartono', dept: 'Operasional', position: 'Driver', basic: 4500000, allowance: 1000000, deductions: 315000, net: 5185000, selected: true },
  { id: 4, name: 'Hendra W.', dept: 'Sales', position: 'Sales', basic: 5500000, allowance: 1375000, deductions: 385000, net: 6490000, selected: true },
  { id: 5, name: 'Rina Wati', dept: 'SDM', position: 'Staff HR', basic: 5200000, allowance: 1300000, deductions: 364000, net: 6136000, selected: true },
];

export default function BatchPayrollPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [employees, setEmployees] = useState(SAMPLE_EMPLOYEES);
  const [period, setPeriod] = useState('Juni 2025');
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);

  if (!token) return null;

  const toggleSelect = (id: number) => setEmployees(es => es.map(e => e.id === id ? { ...e, selected: !e.selected } : e));
  const selectAll = () => setEmployees(es => es.map(e => ({ ...e, selected: true })));
  const deselectAll = () => setEmployees(es => es.map(e => ({ ...e, selected: false })));

  const selected = employees.filter(e => e.selected);
  const totalNet = selected.reduce((s, e) => s + e.net, 0);
  const totalBasic = selected.reduce((s, e) => s + e.basic, 0);
  const totalAllowance = selected.reduce((s, e) => s + e.allowance, 0);
  const totalDeductions = selected.reduce((s, e) => s + e.deductions, 0);

  const processPayroll = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setProcessed(true); }, 2000);
  };

  return (
    <AppShell {...PAYROLL_CONFIG} navItems={PAYROLL_NAV} activeHref="/hr/payrolls/batch">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Slip Gaji Massal</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Proses penggajian untuk semua karyawan sekaligus</p>
          </div>
          <div className="flex gap-2">
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={period} onChange={e => setPeriod(e.target.value)}>
              {['Juni 2025', 'Mei 2025', 'April 2025'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {processed ? (
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#4CAF50' }}>
                <Download className="h-4 w-4" /> Download Semua Slip
              </button>
            ) : (
              <button onClick={processPayroll} disabled={processing || selected.length === 0} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: C }}>
                {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {processing ? 'Memproses...' : `Proses ${selected.length} Karyawan`}
              </button>
            )}
          </div>
        </div>

        {processed && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(76,175,80,.08)', border: '1.5px solid rgba(76,175,80,.3)' }}>
            <Check className="h-5 w-5 flex-shrink-0" style={{ color: '#4CAF50' }} />
            <p className="text-sm" style={{ color: '#388E3C' }}>
              <span className="font-bold">{selected.length} slip gaji</span> untuk periode {period} berhasil dibuat. Total penggajian: <span className="font-bold">{fmt(totalNet)}</span>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Karyawan Dipilih', value: `${selected.length}/${employees.length}`, color: C },
            { label: 'Total Gaji Pokok', value: fmt(totalBasic), color: '#1E1B4B' },
            { label: 'Total Tunjangan', value: fmt(totalAllowance), color: '#4CAF50' },
            { label: 'Total Gaji Bersih', value: fmt(totalNet), color: C },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-lg font-bold mt-1 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Daftar Karyawan — {period}</h3>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${C}15`, color: C }}>Pilih Semua</button>
              <button onClick={deselectAll} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(158,158,158,.1)', color: '#6B7280' }}>Batal Pilih</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['', 'Karyawan', 'Departemen', 'Jabatan', 'Gaji Pokok', 'Tunjangan', 'Potongan', 'Gaji Bersih', processed ? 'Aksi' : ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={emp.selected} onChange={() => toggleSelect(emp.id)} className="rounded" style={{ accentColor: C }} />
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: emp.selected ? '#1E1B4B' : '#9CA3AF' }}>{emp.name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{emp.dept}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{emp.position}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#1E1B4B' }}>{fmt(emp.basic)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#4CAF50' }}>{fmt(emp.allowance)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#EA5455' }}>-{fmt(emp.deductions)}</td>
                    <td className="px-4 py-3 font-bold text-sm" style={{ color: C }}>{fmt(emp.net)}</td>
                    {processed && (
                      <td className="px-4 py-3">
                        <button className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg" style={{ backgroundColor: `${C}15`, color: C }}>
                          <FileText className="h-3 w-3" /> Download
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  <td colSpan={4} className="px-4 py-3 font-bold text-sm" style={{ color: '#1E1B4B' }}>TOTAL ({selected.length} karyawan)</td>
                  <td className="px-4 py-3 font-bold text-xs" style={{ color: '#1E1B4B' }}>{fmt(totalBasic)}</td>
                  <td className="px-4 py-3 font-bold text-xs" style={{ color: '#4CAF50' }}>{fmt(totalAllowance)}</td>
                  <td className="px-4 py-3 font-bold text-xs" style={{ color: '#EA5455' }}>-{fmt(totalDeductions)}</td>
                  <td className="px-4 py-3 font-bold text-sm" style={{ color: C }}>{fmt(totalNet)}</td>
                  {processed && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
