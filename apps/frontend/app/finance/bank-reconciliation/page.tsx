'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { Scale, Check, X, AlertTriangle, Upload, RefreshCw } from 'lucide-react';

const C = ACCOUNTING_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const BANK_STATEMENTS = [
  { id: 1, date: '2025-06-25', description: 'Transfer dari PT. Maju Jaya', ref: 'TRF-001', amount: 15000000, type: 'credit', matched: true, erp_ref: 'INV-0089' },
  { id: 2, date: '2025-06-25', description: 'Pembayaran ke PT. Supplier Utama', ref: 'TRF-002', amount: 45000000, type: 'debit', matched: true, erp_ref: 'PO-0067' },
  { id: 3, date: '2025-06-24', description: 'Transfer Masuk Tidak Dikenal', ref: 'TRF-003', amount: 2500000, type: 'credit', matched: false, erp_ref: null },
  { id: 4, date: '2025-06-24', description: 'Biaya Administrasi Bank', ref: 'TRF-004', amount: 25000, type: 'debit', matched: false, erp_ref: null },
  { id: 5, date: '2025-06-23', description: 'Transfer dari CV. Berkah Abadi', ref: 'TRF-005', amount: 8500000, type: 'credit', matched: true, erp_ref: 'INV-0085' },
];

export default function BankReconciliationPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [statements, setStatements] = useState(BANK_STATEMENTS);
  const [period, setPeriod] = useState('2025-06');
  const [bankAccount, setBankAccount] = useState('BCA - 1234567890');

  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;

  const matched = statements.filter(s => s.matched).length;
  const unmatched = statements.filter(s => !s.matched).length;
  const totalIn = statements.filter(s => s.type === 'credit').reduce((sum, s) => sum + s.amount, 0);
  const totalOut = statements.filter(s => s.type === 'debit').reduce((sum, s) => sum + s.amount, 0);

  const matchItem = (id: number) => setStatements(st => st.map(s => s.id === id ? { ...s, matched: true, erp_ref: 'MANUAL' } : s));

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/bank-reconciliation">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Rekonsiliasi Bank</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Cocokkan transaksi bank dengan pencatatan di sistem ERP</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>
              <Upload className="h-4 w-4" /> Import Statement
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
              <RefreshCw className="h-4 w-4" /> Auto Match
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Rekening Bank</label>
              <select className="w-full mt-1 rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={bankAccount} onChange={e => setBankAccount(e.target.value)}>
                <option value="BCA - 1234567890">BCA - 1234567890</option>
                <option value="Mandiri - 0987654321">Mandiri - 0987654321</option>
                <option value="BRI - 5678901234">BRI - 5678901234</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Periode</label>
              <input type="month" className="w-full mt-1 rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={period} onChange={e => setPeriod(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Saldo Akhir Bank</label>
              <input type="number" className="w-full mt-1 rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="0" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Transaksi', value: statements.length, color: C },
            { label: 'Sudah Cocok', value: matched, color: '#4CAF50' },
            { label: 'Belum Cocok', value: unmatched, color: '#EA5455' },
            { label: 'Selisih (Net)', value: fmt(totalIn - totalOut), color: totalIn >= totalOut ? '#4CAF50' : '#EA5455' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-xl font-bold mt-1 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {unmatched > 0 && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(234,84,85,.06)', border: '1.5px solid rgba(234,84,85,.2)' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: '#EA5455' }} />
            <p className="text-sm" style={{ color: '#C62828' }}>
              <span className="font-bold">{unmatched} transaksi</span> belum dicocokkan dengan data ERP. Periksa dan cocokkan secara manual.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Statement Bank — {bankAccount}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Tanggal', 'Deskripsi', 'Ref. Bank', 'Tipe', 'Jumlah', 'Status', 'Ref. ERP', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statements.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(s.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 font-medium text-xs" style={{ color: '#1E1B4B' }}>{s.description}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#6B7280' }}>{s.ref}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.type === 'credit' ? '#4CAF50' : '#EA5455', backgroundColor: s.type === 'credit' ? 'rgba(76,175,80,.1)' : 'rgba(234,84,85,.1)' }}>
                        {s.type === 'credit' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-xs" style={{ color: s.type === 'credit' ? '#4CAF50' : '#EA5455' }}>
                      {s.type === 'debit' ? '-' : '+'}{fmt(s.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {s.matched ? (
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" style={{ color: '#4CAF50' }} />
                          <span className="text-xs font-semibold" style={{ color: '#4CAF50' }}>Cocok</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#FF9800' }} />
                          <span className="text-xs font-semibold" style={{ color: '#FF9800' }}>Belum</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: C }}>{s.erp_ref ?? '-'}</td>
                    <td className="px-4 py-3">
                      {!s.matched && (
                        <button onClick={() => matchItem(s.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: `${C}15`, color: C }}>
                          Cocokkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
