'use client';

import { useState, useEffect, useCallback } from 'react';
import ModernLayout from '../../../components/layout/ModernLayout';
import { TrendingUp, TrendingDown, Minus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(Math.round(Math.abs(n)));
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface TaxLine {
  id: string; referenceId: string; referenceType: string;
  baseAmount: number; taxAmount: number; createdAt: string;
  tax?: { kode: string; nama: string; rate: number };
}

interface RekapResult {
  periode: string;
  ppnMasukan: { items: TaxLine[]; total: number };
  ppnKeluaran: { items: TaxLine[]; total: number };
  kurangLebih: number;
  status: 'KURANG_BAYAR' | 'LEBIH_BAYAR' | 'NIHIL';
}

const STATUS_CONFIG = {
  KURANG_BAYAR: { label: 'Kurang Bayar', color: 'text-red-600 bg-red-50', icon: TrendingDown },
  LEBIH_BAYAR:  { label: 'Lebih Bayar',  color: 'text-green-600 bg-green-50', icon: TrendingUp },
  NIHIL:        { label: 'Nihil',         color: 'text-gray-600 bg-gray-100', icon: Minus },
};

export default function RekapPPNPage() {
  const [periode, setPeriode] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [result, setResult] = useState<RekapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMasukan, setShowMasukan] = useState(true);
  const [showKeluaran, setShowKeluaran] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/tax/efaktur/rekap-ppn?periode=${periode}`, { credentials: 'include' });
      const d = await r.json();
      setResult(d);
    } catch { setResult(null); } finally { setLoading(false); }
  }, [periode]);

  useEffect(() => { load(); }, [load]);

  const sc = result ? STATUS_CONFIG[result.status] : null;
  const StatusIcon = sc?.icon ?? Minus;

  return (
    <ModernLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rekap PPN</h1>
            <p className="text-sm text-gray-500 mt-0.5">PPN Masukan vs PPN Keluaran per periode</p>
          </div>
          <div className="flex gap-2">
            <input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-12 text-center text-gray-400 text-sm">Memuat rekap PPN...</div>
        )}

        {!loading && result && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                label="PPN Keluaran"
                value={`Rp ${fmt(result.ppnKeluaran.total)}`}
                sub={`${result.ppnKeluaran.items.length} transaksi`}
                color="blue"
                icon={TrendingUp}
              />
              <SummaryCard
                label="PPN Masukan"
                value={`Rp ${fmt(result.ppnMasukan.total)}`}
                sub={`${result.ppnMasukan.items.length} transaksi`}
                color="indigo"
                icon={TrendingDown}
              />
              <div className={`rounded-xl p-4 border ${result.kurangLebih > 0 ? 'border-red-200 bg-red-50' : result.kurangLebih < 0 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className={`w-5 h-5 ${result.kurangLebih > 0 ? 'text-red-600' : result.kurangLebih < 0 ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className="text-xs font-semibold text-gray-500 uppercase">{sc?.label}</span>
                </div>
                <div className={`text-xl font-bold ${result.kurangLebih > 0 ? 'text-red-700' : result.kurangLebih < 0 ? 'text-green-700' : 'text-gray-700'}`}>
                  Rp {fmt(result.kurangLebih)}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Keluaran - Masukan</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-80">Periode</div>
                    <div className="text-xl font-bold">{new Date(periode + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${result.kurangLebih > 0 ? 'bg-red-400/30 text-white' : 'bg-green-400/30 text-white'}`}>
                    {sc?.label}: Rp {fmt(result.kurangLebih)}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                <Section
                  title="PPN Keluaran (Penjualan)"
                  total={result.ppnKeluaran.total}
                  items={result.ppnKeluaran.items}
                  open={showKeluaran}
                  onToggle={() => setShowKeluaran((v) => !v)}
                  colorClass="text-blue-700"
                />
                <Section
                  title="PPN Masukan (Pembelian)"
                  total={result.ppnMasukan.total}
                  items={result.ppnMasukan.items}
                  open={showMasukan}
                  onToggle={() => setShowMasukan((v) => !v)}
                  colorClass="text-indigo-700"
                />
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Kurang / Lebih Bayar PPN</span>
                  <span className={`text-lg font-bold ${result.kurangLebih > 0 ? 'text-red-600' : result.kurangLebih < 0 ? 'text-green-600' : 'text-gray-700'}`}>
                    {result.kurangLebih > 0 ? '+' : result.kurangLebih < 0 ? '-' : ''}Rp {fmt(result.kurangLebih)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {result.status === 'KURANG_BAYAR'
                    ? 'Perusahaan wajib menyetor PPN ini ke kas negara.'
                    : result.status === 'LEBIH_BAYAR'
                    ? 'Perusahaan dapat mengajukan restitusi atau dikompensasi ke masa berikutnya.'
                    : 'Tidak ada kewajiban setor maupun restitusi pada periode ini.'}
                </p>
              </div>
            </div>
          </>
        )}

        {!loading && !result && (
          <div className="p-12 text-center text-gray-400 text-sm">
            Pilih periode dan klik Refresh untuk melihat rekap PPN.
          </div>
        )}
      </div>
    </ModernLayout>
  );
}

function SummaryCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub: string; color: string; icon: any;
}) {
  return (
    <div className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 text-${color}-600`} />
        <span className={`text-xs font-semibold text-${color}-600 uppercase`}>{label}</span>
      </div>
      <div className={`text-xl font-bold text-${color}-800`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}

function Section({ title, total, items, open, onToggle, colorClass }: {
  title: string; total: number; items: TaxLine[];
  open: boolean; onToggle: () => void; colorClass: string;
}) {
  return (
    <div>
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          <span className="font-semibold text-gray-900 text-sm">{title}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <span className={`font-bold text-sm ${colorClass}`}>Rp {fmt(total)}</span>
      </button>
      {open && items.length > 0 && (
        <div className="px-6 pb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 font-medium">Referensi</th>
                <th className="text-left py-2 font-medium">Tanggal</th>
                <th className="text-left py-2 font-medium">Pajak</th>
                <th className="text-right py-2 font-medium">DPP</th>
                <th className="text-right py-2 font-medium">Pajak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className="text-gray-600">
                  <td className="py-2 font-mono">{item.referenceId.slice(0, 8)}…</td>
                  <td className="py-2">{fmtDate(item.createdAt)}</td>
                  <td className="py-2">{item.tax?.nama ?? '-'}</td>
                  <td className="py-2 text-right">Rp {fmt(Number(item.baseAmount))}</td>
                  <td className={`py-2 text-right font-semibold ${colorClass}`}>Rp {fmt(Number(item.taxAmount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && items.length === 0 && (
        <div className="px-6 pb-4 text-xs text-gray-400 italic">Tidak ada transaksi pada periode ini.</div>
      )}
    </div>
  );
}
