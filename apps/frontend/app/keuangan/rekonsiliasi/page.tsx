'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Upload, Zap, RefreshCw, CheckCircle, XCircle, ArrowLeftRight } from 'lucide-react';

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
const BANK_FORMATS = ['bca', 'mandiri', 'bri', 'bni', 'general'];

export default function RekonsiliasiPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankAccountId, setBankAccountId] = useState('');
  const [format, setFormat] = useState('general');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(today);
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  useEffect(() => { if (!token) router.push('/login'); }, [token]);

  useEffect(() => {
    if (!token) return;
    api.get('/finance/bank-accounts').then((res) => {
      const data = res.data?.data ?? res.data ?? [];
      setBankAccounts(data);
      if (data.length > 0) setBankAccountId(data[0].id);
    }).catch(() => {});
  }, [token]);

  const fetchSummary = async () => {
    if (!bankAccountId) return;
    try {
      const res = await api.get('/finance/bank/reconciliation-summary', { params: { bankAccountId, from, to } });
      setSummary(res.data);
    } catch {}
  };

  const fetchTransactions = async () => {
    if (!bankAccountId) return;
    setLoading(true);
    try {
      const res = await api.get('/finance/bank/transactions', { params: { bankAccountId, status: statusFilter || undefined, from, to, limit: 100 } });
      setTransactions(res.data?.data ?? []);
    } catch { setTransactions([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (bankAccountId) { fetchSummary(); fetchTransactions(); }
  }, [bankAccountId, statusFilter]);

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv,.txt';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const res = await api.post('/finance/bank/import-mutasi', { bankAccountId, csvContent: text, format });
        alert(res.data.message);
        fetchSummary(); fetchTransactions();
      } catch { alert('Import gagal'); }
      finally { setImporting(false); }
    };
    input.click();
  };

  const handleAutoMatch = async () => {
    setAutoMatching(true);
    try {
      const res = await api.post(`/finance/bank/auto-match?bankAccountId=${bankAccountId}`);
      alert(res.data.message);
      fetchSummary(); fetchTransactions();
    } catch { alert('Auto-match gagal'); }
    finally { setAutoMatching(false); }
  };

  const handleUnmatch = async (id: string) => {
    try {
      await api.patch(`/finance/bank/transactions/${id}/unmatch`);
      fetchTransactions(); fetchSummary();
    } catch {}
  };

  if (!token) return null;

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/keuangan/rekonsiliasi">
      <div className="p-6 space-y-5 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Rekonsiliasi Bank</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Cocokkan mutasi bank dengan jurnal akuntansi</p>
        </div>

        <div className="bg-white p-4 rounded-xl flex flex-wrap gap-3 items-end" style={{ border: '1.5px solid #EDE8F5' }}>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Rekening Bank</label>
            <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }}>
              {bankAccounts.map((b: any) => <option key={b.id} value={b.id}>{b.bankName} — {b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Format Bank</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }}>
              {BANK_FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Dari</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Sampai</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }} />
          </div>
          <button onClick={handleImport} disabled={importing} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: '#2196F3' }}>
            <Upload className="h-4 w-4" /> {importing ? 'Importing...' : 'Import Mutasi'}
          </button>
          <button onClick={handleAutoMatch} disabled={autoMatching} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: '#4CAF50' }}>
            <Zap className="h-4 w-4" /> {autoMatching ? 'Matching...' : 'Auto Match'}
          </button>
          <button onClick={() => { fetchSummary(); fetchTransactions(); }} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg" style={{ border: '1.5px solid #EDE8F5' }}>
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Saldo Buku', value: summary.saldoBuku, color: '#7367F0' },
              { label: 'Saldo Bank', value: summary.saldoBank, color: '#2196F3' },
              { label: 'Selisih', value: summary.selisih, color: Math.abs(summary.selisih) < 1 ? '#4CAF50' : '#EA5455' },
              { label: 'Belum Cocok', value: summary.unmatchedCount, color: '#FF9800', isCount: true },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #EDE8F5' }}>
                <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
                <p className="text-lg font-bold mt-1" style={{ color: s.color }}>
                  {s.isCount ? String(s.value) : fmt(Number(s.value))}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Filter:</span>
          {['', 'unmatched', 'matched', 'excluded'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1 text-xs font-medium rounded-full" style={{
              background: statusFilter === s ? '#7367F0' : '#F3F0FF',
              color: statusFilter === s ? '#fff' : '#7367F0',
            }}>{s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', background: '#F8F7FF' }}>
                  {['Tanggal', 'Keterangan', 'Masuk', 'Keluar', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Memuat...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Tidak ada data. Import mutasi bank terlebih dahulu.</td></tr>
                ) : transactions.map((tx: any) => (
                  <tr key={tx.id} onClick={() => setSelectedLeft(tx.id === selectedLeft ? null : tx.id)}
                    style={{ borderBottom: '1px solid #F5F2FB', cursor: 'pointer', background: selectedLeft === tx.id ? '#F0EDFF' : undefined }}>
                    <td className="px-4 py-2.5 text-sm">{new Date(tx.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: '#374151' }}>{tx.keterangan}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium" style={{ color: '#388E3C' }}>{tx.type === 'in' ? fmt(tx.amount) : '-'}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium" style={{ color: '#EA5455' }}>{tx.type === 'out' ? fmt(tx.amount) : '-'}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{
                        background: tx.status === 'matched' ? 'rgba(76,175,80,.1)' : tx.status === 'unmatched' ? 'rgba(255,152,0,.1)' : 'rgba(158,158,158,.1)',
                        color: tx.status === 'matched' ? '#388E3C' : tx.status === 'unmatched' ? '#E65100' : '#757575',
                      }}>{tx.status}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {tx.status === 'matched' && (
                        <button onClick={(e) => { e.stopPropagation(); handleUnmatch(tx.id); }} className="text-xs px-2 py-1 rounded font-medium" style={{ color: '#EA5455', border: '1px solid #EA545540' }}>Unmatch</button>
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
