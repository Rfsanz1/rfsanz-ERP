'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../../lib/nav-configs';
import { api } from '../../../../lib/api';
import { Download, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Plus } from 'lucide-react';

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:    { bg: 'rgba(158,158,158,.1)', color: '#757575', label: 'Draft' },
  GENERATED:{ bg: 'rgba(33,150,243,.1)', color: '#1565C0', label: 'Generated' },
  UPLOADED: { bg: 'rgba(255,152,0,.1)',  color: '#E65100', label: 'Uploaded' },
  APPROVED: { bg: 'rgba(76,175,80,.1)',  color: '#388E3C', label: 'Approved' },
  REJECTED: { bg: 'rgba(234,84,85,.1)',  color: '#C62828', label: 'Rejected' },
};

export default function EFakturPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const today = new Date();
  const currentPeriode = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [periode, setPeriode] = useState(currentPeriode);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);


  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tax/efaktur/list', { params: { periode } });
      setList(res.data ?? []);
    } catch { setList([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchList(); }, [token, periode]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices', { params: { limit: 50 } });
      setInvoices(res.data?.data ?? []);
    } catch {}
  };

  const handleGenerate = async () => {
    if (selectedInvoices.length === 0) return alert('Pilih minimal 1 invoice');
    setGenerating(true);
    try {
      const res = await api.post('/tax/efaktur/generate', { invoiceIds: selectedInvoices, periode });
      if (res.data.csv) {
        const blob = new Blob(['\uFEFF' + res.data.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `efaktur_${periode}.csv`; a.click();
      }
      alert(`Berhasil generate ${res.data.count} e-Faktur`);
      setShowGenerateModal(false);
      setSelectedInvoices([]);
      fetchList();
    } catch { alert('Generate gagal'); }
    finally { setGenerating(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/tax/efaktur/${id}/status`, { status });
      fetchList();
    } catch { alert('Update status gagal'); }
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/tax/efaktur/export-csv', { params: { periode }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `efaktur_${periode}.csv`; a.click();
    } catch { alert('Export gagal'); }
  };



  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/keuangan/pajak/efaktur">
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>e-Faktur Pajak</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Manajemen faktur pajak sesuai format DJP</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg" style={{ border: '1.5px solid #EDE8F5', color: '#388E3C' }}>
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={() => { setShowGenerateModal(true); fetchInvoices(); }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: '#7367F0' }}>
              <Plus className="h-4 w-4" /> Generate Baru
            </button>
          </div>
        </div>

        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Periode (YYYY-MM)</label>
            <input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }} />
          </div>
          <button onClick={fetchList} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: '#7367F0' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat
          </button>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', background: '#F8F7FF' }}>
                  {['Nomor Faktur', 'Tanggal', 'Pembeli', 'DPP', 'PPN', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Memuat...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Tidak ada e-Faktur untuk periode ini</td></tr>
                ) : list.map((ef: any) => {
                  const st = STATUS_COLORS[ef.status] ?? STATUS_COLORS.DRAFT;
                  return (
                    <tr key={ef.id} style={{ borderBottom: '1px solid #F5F2FB' }}>
                      <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: '#7367F0' }}>{ef.nomorFaktur}</td>
                      <td className="px-4 py-3 text-sm">{new Date(ef.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 text-sm">{ef.namaPembeli ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-right">Rp {Number(ef.nilaiDPP).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-sm text-right">Rp {Number(ef.nilaiPPN).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select defaultValue="" onChange={(e) => { if (e.target.value) updateStatus(ef.id, e.target.value); }} className="text-xs border rounded px-2 py-1" style={{ borderColor: '#E5E7EB', color: '#374151' }}>
                          <option value="">Update...</option>
                          <option value="UPLOADED">Uploaded</option>
                          <option value="APPROVED">Approved</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {showGenerateModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,.4)' }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" style={{ border: '1.5px solid #EDE8F5' }}>
              <h2 className="font-bold text-base mb-3" style={{ color: '#1E1B4B' }}>Generate e-Faktur dari Invoice</h2>
              <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Pilih invoice yang akan di-generate menjadi e-Faktur (periode: {periode})</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {invoices.map((inv: any) => (
                  <label key={inv.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer" style={{ border: selectedInvoices.includes(inv.id) ? '1.5px solid #7367F0' : '1.5px solid #EDE8F5' }}>
                    <input type="checkbox" checked={selectedInvoices.includes(inv.id)} onChange={(e) => setSelectedInvoices(prev => e.target.checked ? [...prev, inv.id] : prev.filter(id => id !== inv.id))} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{inv.noInvoice}</div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>PPN: Rp {Number(inv.pajak ?? 0).toLocaleString('id-ID')}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-2 text-sm font-medium rounded-lg" style={{ border: '1.5px solid #EDE8F5' }}>Batal</button>
                <button onClick={handleGenerate} disabled={generating} className="flex-1 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: '#7367F0' }}>
                  {generating ? 'Generating...' : `Generate (${selectedInvoices.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
