'use client';

import { useState, useEffect, useCallback } from 'react';
import ModernLayout from '../../../components/layout/ModernLayout';
import {
  FileText, Plus, Download, Upload, Trash2, Search,
  CheckCircle, Clock, AlertCircle, RefreshCw,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_CONFIG = {
  DRAFT:    { label: 'Draft',    color: 'bg-gray-100 text-gray-600',    icon: Clock },
  UPLOADED: { label: 'Uploaded', color: 'bg-blue-100 text-blue-700',    icon: Upload },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700',  icon: CheckCircle },
};

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID').format(Math.round(n));
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface EFaktur {
  id: string; nomorFaktur: string; tanggal: string;
  npwpPembeli?: string; namaPembeli?: string;
  nilaiDPP: number; nilaiPPN: number; status: keyof typeof STATUS_CONFIG;
  tax?: { nama: string };
}

export default function EFakturPage() {
  const [efakturs, setEfakturs] = useState<EFaktur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [periode, setPeriode] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    npwpPembeli: '', namaPembeli: '', nilaiDPP: '', nilaiPPN: '', tanggal: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/tax/efaktur/list?periode=${periode}`, { credentials: 'include' });
      const d = await r.json();
      setEfakturs(Array.isArray(d) ? d : []);
    } catch { setEfakturs([]); } finally { setLoading(false); }
  }, [periode]);

  useEffect(() => { load(); }, [load]);

  const filtered = efakturs.filter((ef) =>
    ef.nomorFaktur.includes(search) ||
    (ef.namaPembeli ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (ef.npwpPembeli ?? '').includes(search)
  );

  async function create() {
    if (!createForm.nilaiDPP || !createForm.nilaiPPN) return;
    setSaving(true);
    try {
      await fetch(`${API}/tax/efaktur`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          nilaiDPP: Number(createForm.nilaiDPP),
          nilaiPPN: Number(createForm.nilaiPPN),
        }),
      });
      setShowCreateForm(false);
      setCreateForm({ npwpPembeli: '', namaPembeli: '', nilaiDPP: '', nilaiPPN: '', tanggal: new Date().toISOString().slice(0, 10) });
      await load();
    } finally { setSaving(false); }
  }

  async function exportCSV() {
    setExporting(true);
    try {
      const r = await fetch(`${API}/tax/efaktur/export-csv?periode=${periode}`, { credentials: 'include' });
      if (!r.ok) { alert('Tidak ada data untuk periode ini'); return; }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `efaktur_${periode}.csv`; a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  }

  async function changeStatus(id: string, status: string) {
    await fetch(`${API}/tax/efaktur/${id}/status`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function remove(id: string) {
    await fetch(`${API}/tax/efaktur/${id}`, { method: 'DELETE', credentials: 'include' });
    setDeleteId(null);
    await load();
  }

  const totalDPP = filtered.reduce((s, e) => s + Number(e.nilaiDPP), 0);
  const totalPPN = filtered.reduce((s, e) => s + Number(e.nilaiPPN), 0);

  return (
    <ModernLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">E-Faktur Pajak</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola faktur pajak keluaran untuk upload ke DJP</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportCSV} disabled={exporting || filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors">
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV DJP
            </button>
            <button onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Buat E-Faktur
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Faktur', value: String(filtered.length), sub: 'dokumen', color: 'blue' },
            { label: 'Total DPP', value: `Rp ${fmt(totalDPP)}`, sub: 'nilai dasar pengenaan', color: 'indigo' },
            { label: 'Total PPN', value: `Rp ${fmt(totalPPN)}`, sub: 'pajak keluaran', color: 'purple' },
          ].map((c) => (
            <div key={c.label} className={`bg-${c.color}-50 border border-${c.color}-100 rounded-xl p-4`}>
              <div className={`text-xl font-bold text-${c.color}-800`}>{c.value}</div>
              <div className={`text-xs font-semibold text-${c.color}-600 mt-0.5`}>{c.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor faktur, nama, atau NPWP..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-gray-400 text-sm">Belum ada e-Faktur untuk periode ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Nomor Faktur','Tanggal','Pembeli / NPWP','DPP','PPN','Status','Aksi'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((ef) => {
                    const sc = STATUS_CONFIG[ef.status];
                    const Icon = sc.icon;
                    return (
                      <tr key={ef.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{ef.nomorFaktur}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(ef.tanggal)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{ef.namaPembeli || '-'}</div>
                          <div className="text-xs text-gray-400 font-mono">{ef.npwpPembeli || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-700">Rp {fmt(Number(ef.nilaiDPP))}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">Rp {fmt(Number(ef.nilaiPPN))}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.color}`}>
                            <Icon className="w-3 h-3" /> {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {ef.status === 'DRAFT' && (
                              <button onClick={() => changeStatus(ef.id, 'UPLOADED')}
                                className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium transition-colors">
                                Upload
                              </button>
                            )}
                            {ef.status === 'UPLOADED' && (
                              <button onClick={() => changeStatus(ef.id, 'APPROVED')}
                                className="px-2 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md font-medium transition-colors">
                                Approve
                              </button>
                            )}
                            {ef.status === 'DRAFT' && (
                              <button onClick={() => setDeleteId(ef.id)}
                                className="p-1 hover:bg-red-50 text-red-500 rounded-md transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Buat E-Faktur Manual</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tanggal Faktur</label>
              <input type="date" value={createForm.tanggal} onChange={(e) => setCreateForm({ ...createForm, tanggal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">NPWP Pembeli</label>
              <input value={createForm.npwpPembeli} onChange={(e) => setCreateForm({ ...createForm, npwpPembeli: e.target.value })}
                placeholder="00.000.000.0-000.000"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nama Pembeli</label>
              <input value={createForm.namaPembeli} onChange={(e) => setCreateForm({ ...createForm, namaPembeli: e.target.value })}
                placeholder="PT. Nama Perusahaan"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nilai DPP (Rp) *</label>
                <input type="number" value={createForm.nilaiDPP} onChange={(e) => setCreateForm({ ...createForm, nilaiDPP: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nilai PPN (Rp) *</label>
                <input type="number" value={createForm.nilaiPPN} onChange={(e) => setCreateForm({ ...createForm, nilaiPPN: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
            {createForm.nilaiDPP && (
              <p className="text-xs text-gray-400">
                Auto-hitung 11%: Rp {fmt(Number(createForm.nilaiDPP) * 0.11)}
                <button onClick={() => setCreateForm({ ...createForm, nilaiPPN: String(Math.round(Number(createForm.nilaiDPP) * 0.11)) })}
                  className="ml-2 text-blue-600 underline">Gunakan</button>
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCreateForm(false)}
                className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={create} disabled={saving || !createForm.nilaiDPP || !createForm.nilaiPPN}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold transition-colors">
                {saving ? 'Membuat...' : 'Buat Faktur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <h2 className="font-bold text-gray-900">Hapus E-Faktur?</h2>
                <p className="text-sm text-gray-500">Hanya e-Faktur berstatus DRAFT yang bisa dihapus.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm">Batal</button>
              <button onClick={() => remove(deleteId)} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
