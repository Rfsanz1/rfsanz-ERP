'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { HR_CONFIG, HR_NAV } from '../../../lib/nav-configs';
import { Heart, Calculator, Search, Download, RefreshCw } from 'lucide-react';

const C = HR_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const BPJS_RATES = {
  kes_employer: 4,
  kes_employee: 1,
  tk_jht_employer: 3.7,
  tk_jht_employee: 2,
  tk_jp_employer: 2,
  tk_jp_employee: 1,
  tk_jkk: 0.24,
  tk_jkm: 0.3,
};

const SAMPLE_EMPLOYEES = [
  { id: 1, name: 'Budi Santoso', position: 'Manajer', salary: 15000000 },
  { id: 2, name: 'Siti Rahayu', position: 'Supervisor', salary: 8000000 },
  { id: 3, name: 'Ahmad Fauzi', position: 'Staff', salary: 5000000 },
  { id: 4, name: 'Dewi Kusuma', position: 'Staff', salary: 4500000 },
  { id: 5, name: 'Hendra Wijaya', position: 'QC', salary: 5500000 },
];

const calcBPJS = (salary: number) => {
  const kesEmployer = salary * BPJS_RATES.kes_employer / 100;
  const kesEmployee = salary * BPJS_RATES.kes_employee / 100;
  const jhtEmployer = salary * BPJS_RATES.tk_jht_employer / 100;
  const jhtEmployee = salary * BPJS_RATES.tk_jht_employee / 100;
  const jpEmployer = salary * BPJS_RATES.tk_jp_employer / 100;
  const jpEmployee = salary * BPJS_RATES.tk_jp_employee / 100;
  const jkk = salary * BPJS_RATES.tk_jkk / 100;
  const jkm = salary * BPJS_RATES.tk_jkm / 100;
  return {
    kesEmployer, kesEmployee,
    jhtEmployer, jhtEmployee,
    jpEmployer, jpEmployee, jkk, jkm,
    totalEmployer: kesEmployer + jhtEmployer + jpEmployer + jkk + jkm,
    totalEmployee: kesEmployee + jhtEmployee + jpEmployee,
    grandTotal: kesEmployer + jhtEmployer + jpEmployer + jkk + jkm + kesEmployee + jhtEmployee + jpEmployee,
  };
};

export default function BPJSPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [calcSalary, setCalcSalary] = useState('');
  const [calcResult, setCalcResult] = useState<any>(null);

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const filtered = SAMPLE_EMPLOYEES.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  const totalEmployer = filtered.reduce((s, e) => s + calcBPJS(e.salary).totalEmployer, 0);
  const totalEmployee = filtered.reduce((s, e) => s + calcBPJS(e.salary).totalEmployee, 0);

  const doCalc = () => {
    if (!calcSalary) return;
    setCalcResult(calcBPJS(+calcSalary));
  };

  return (
    <AppShell {...HR_CONFIG} navItems={HR_NAV} activeHref="/hr/bpjs">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Manajemen BPJS</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola iuran BPJS Kesehatan dan Ketenagakerjaan</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>
            <Download className="h-4 w-4" /> Export Laporan BPJS
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Karyawan BPJS', value: filtered.length, color: C },
            { label: 'Iuran Perusahaan/bln', value: fmt(totalEmployer), color: '#2196F3' },
            { label: 'Iuran Karyawan/bln', value: fmt(totalEmployee), color: '#FF9800' },
            { label: 'Total BPJS/bln', value: fmt(totalEmployer + totalEmployee), color: '#4CAF50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-lg font-bold mt-1 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
              <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Iuran BPJS per Karyawan</h3>
              <div className="relative flex-1 max-w-xs ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
                <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari karyawan..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                    {['Karyawan', 'Jabatan', 'Gaji Pokok', 'BPJS Kes (Emp)', 'BPJS Kes (TK)', 'JHT (Emp)', 'JHT (TK)', 'JP (Emp)', 'JP (TK)', 'JKK+JKM', 'Total'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => {
                    const b = calcBPJS(emp.salary);
                    return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium" style={{ color: '#1E1B4B' }}>{emp.name}</td>
                        <td className="px-3 py-2.5" style={{ color: '#6B7280' }}>{emp.position}</td>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: '#1E1B4B' }}>{fmt(emp.salary)}</td>
                        <td className="px-3 py-2.5" style={{ color: '#2196F3' }}>{fmt(b.kesEmployer)}</td>
                        <td className="px-3 py-2.5" style={{ color: '#FF9800' }}>{fmt(b.kesEmployee)}</td>
                        <td className="px-3 py-2.5" style={{ color: '#2196F3' }}>{fmt(b.jhtEmployer)}</td>
                        <td className="px-3 py-2.5" style={{ color: '#FF9800' }}>{fmt(b.jhtEmployee)}</td>
                        <td className="px-3 py-2.5" style={{ color: '#2196F3' }}>{fmt(b.jpEmployer)}</td>
                        <td className="px-3 py-2.5" style={{ color: '#FF9800' }}>{fmt(b.jpEmployee)}</td>
                        <td className="px-3 py-2.5" style={{ color: '#9C27B0' }}>{fmt(b.jkk + b.jkm)}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: C }}>{fmt(b.grandTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
              <Calculator className="h-4 w-4" style={{ color: C }} /> Kalkulator BPJS
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Gaji Pokok (Rp)</label>
                <input type="number" className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Masukkan gaji..." value={calcSalary} onChange={e => setCalcSalary(e.target.value)} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
              </div>
              <button onClick={doCalc} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                Hitung BPJS
              </button>
              {calcResult && (
                <div className="space-y-2 mt-4 pt-4" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <p className="text-xs font-bold" style={{ color: '#2196F3' }}>Tanggungan Perusahaan</p>
                  {[
                    { label: 'BPJS Kesehatan (4%)', value: calcResult.kesEmployer },
                    { label: 'JHT (3.7%)', value: calcResult.jhtEmployer },
                    { label: 'JP (2%)', value: calcResult.jpEmployer },
                    { label: 'JKK (0.24%)', value: calcResult.jkk },
                    { label: 'JKM (0.3%)', value: calcResult.jkm },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-xs">
                      <span style={{ color: '#6B7280' }}>{r.label}</span>
                      <span className="font-semibold" style={{ color: '#2196F3' }}>{fmt(r.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold pt-1" style={{ borderTop: '1px solid #EDE8F5', color: '#2196F3' }}>
                    <span>Total Employer</span><span>{fmt(calcResult.totalEmployer)}</span>
                  </div>
                  <p className="text-xs font-bold pt-2" style={{ color: '#FF9800' }}>Potongan Karyawan</p>
                  {[
                    { label: 'BPJS Kesehatan (1%)', value: calcResult.kesEmployee },
                    { label: 'JHT (2%)', value: calcResult.jhtEmployee },
                    { label: 'JP (1%)', value: calcResult.jpEmployee },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-xs">
                      <span style={{ color: '#6B7280' }}>{r.label}</span>
                      <span className="font-semibold" style={{ color: '#FF9800' }}>{fmt(r.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold pt-1" style={{ borderTop: '1px solid #EDE8F5', color: '#FF9800' }}>
                    <span>Total Potongan</span><span>{fmt(calcResult.totalEmployee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '2px solid #EDE8F5', color: C }}>
                    <span>Grand Total</span><span>{fmt(calcResult.grandTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
