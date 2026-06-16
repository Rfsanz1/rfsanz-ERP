'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../../lib/nav-configs';
import { api } from '../../../../lib/api';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function LaporanPajakPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const [tab, setTab] = useState<'keluaran' | 'masukan'>('keluaran');
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);


  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'keluaran' ? '/tax/report/keluaran' : '/tax/report/masukan';
      const res = await api.get(endpoint, { params: { from, to } });
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) { setData(null); fetchData(); } }, [token, tab]);



  const items = data?.items ?? [];
  const totalDPP = data?.totalDPP ?? 0;
  const totalPPN = data?.totalPPN ?? 0;

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/keuangan/pajak/laporan">
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Laporan Pajak</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Rekap PPN Masukan & Keluaran</p>
        </div>

        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#F3F0FF' }}>
          {([['keluaran', 'Pajak Keluaran', TrendingUp], ['masukan', 'Pajak Masukan', TrendingDown]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all" style={{
              background: tab === key ? '#7367F0' : 'transparent',
              color: tab === key ? '#fff' : '#6B7280',
            }}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Dari</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Sampai</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }} />
          </div>
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: '#7367F0' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Tampilkan
          </button>
        </div>

        {data && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Jumlah Faktur', value: String(items.length), color: '#7367F0' },
              { label: 'Total DPP', value: fmt(totalDPP), color: '#2196F3' },
              { label: 'Total PPN', value: fmt(totalPPN), color: '#388E3C' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #EDE8F5' }}>
                <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
                <p className="text-lg font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', background: '#F8F7FF' }}>
                  {tab === 'keluaran'
                    ? ['No. Invoice', 'Tanggal', 'Nama Pembeli', 'NPWP', 'DPP', 'PPN']
                    : ['No. Bill', 'Tanggal', 'Nama Vendor', 'NPWP', 'DPP', 'PPN']
                  }.map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Memuat...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Tidak ada data untuk periode ini</td></tr>
                ) : items.map((item: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F5F2FB' }}>
                    <td className="px-4 py-2.5 text-sm font-mono font-medium" style={{ color: '#7367F0' }}>{item.noInvoice ?? item.noBill}</td>
                    <td className="px-4 py-2.5 text-sm">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-2.5 text-sm">{item.namaPembeli ?? item.namaVendor}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-xs" style={{ color: '#6B7280' }}>{item.npwpPembeli ?? item.npwpVendor}</td>
                    <td className="px-4 py-2.5 text-sm text-right">Rp {item.dpp.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium" style={{ color: '#388E3C' }}>Rp {item.ppn.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#F8F7FF', borderTop: '2px solid #EDE8F5' }}>
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold">TOTAL ({items.length} faktur)</td>
                    <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#2196F3' }}>{fmt(totalDPP)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#388E3C' }}>{fmt(totalPPN)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
