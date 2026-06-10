'use client';

import { useState, useEffect, useCallback } from 'react';
import ModernLayout from '../../../components/layout/ModernLayout';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Search } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const TAX_TYPES = ['PPN','PPH21','PPH23','PPH25','PPH4A2'] as const;
const TYPE_LABELS: Record<string, string> = {
  PPN: 'PPN', PPH21: 'PPh 21', PPH23: 'PPh 23', PPH25: 'PPh 25', PPH4A2: 'PPh 4(2)',
};
const TYPE_COLORS: Record<string, string> = {
  PPN: 'bg-blue-100 text-blue-700',
  PPH21: 'bg-purple-100 text-purple-700',
  PPH23: 'bg-amber-100 text-amber-700',
  PPH25: 'bg-green-100 text-green-700',
  PPH4A2: 'bg-red-100 text-red-700',
};

interface Tax {
  id: string; kode: string; nama: string; tipe: string;
  rate: number; isActive: boolean; accountId?: string;
}

const emptyForm = { kode: '', nama: '', tipe: 'PPN', rate: 11, isActive: true, accountId: '' };

export default function TaxSetupPage() {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/tax`, { credentials: 'include' });
      const d = await r.json();
      setTaxes(Array.isArray(d) ? d : []);
    } catch { setTaxes([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = taxes.filter((t) => {
    const matchSearch = t.nama.toLowerCase().includes(search.toLowerCase()) ||
      t.kode.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || t.tipe === filterType;
    return matchSearch && matchType;
  });

  function openNew() {
    setEditId(null); setForm({ ...emptyForm }); setShowForm(true);
  }

  function openEdit(t: Tax) {
    setEditId(t.id);
    setForm({ kode: t.kode, nama: t.nama, tipe: t.tipe, rate: Number(t.rate), isActive: t.isActive, accountId: t.accountId ?? '' });
    setShowForm(true);
  }

  async function save() {
    if (!form.kode || !form.nama) return;
    setSaving(true);
    try {
      const url = editId ? `${API}/tax/${editId}` : `${API}/tax`;
      const method = editId ? 'PUT' : 'POST';
      await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rate: Number(form.rate) }),
      });
      setShowForm(false);
      await load();
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    await fetch(`${API}/tax/${id}`, { method: 'DELETE', credentials: 'include' });
    setDeleteId(null);
    await load();
  }

  async function toggleActive(t: Tax) {
    await fetch(`${API}/tax/${t.id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    await load();
  }

  return (
    <ModernLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Setup Pajak</h1>
            <p className="text-sm text-gray-500 mt-0.5">Konfigurasi jenis pajak Indonesia (PPN, PPh)</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Tambah Pajak
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama pajak..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Semua Jenis</option>
            {TAX_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              {taxes.length === 0 ? 'Belum ada data pajak. Klik "Tambah Pajak" untuk mulai.' : 'Tidak ada data yang cocok.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Kode','Nama Pajak','Jenis','Tarif','Status','Aksi'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-700">{t.kode}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{t.nama}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[t.tipe] || 'bg-gray-100 text-gray-700'}`}>
                        {TYPE_LABELS[t.tipe] || t.tipe}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{Number(t.rate).toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(t)}
                        className={`flex items-center gap-1 text-xs font-semibold ${t.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {t.isActive
                          ? <><CheckCircle className="w-4 h-4" /> Aktif</>
                          : <><XCircle className="w-4 h-4" /> Nonaktif</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(t)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(t.id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit' : 'Tambah'} Jenis Pajak</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Kode Pajak *</label>
                  <input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    placeholder="contoh: PPN-11" disabled={!!editId}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Jenis Pajak *</label>
                  <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {TAX_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Nama Pajak *</label>
                <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="contoh: PPN 11%" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tarif (%)</label>
                  <input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                    min="0" max="100" step="0.5"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-sm text-gray-700">Aktif</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">ID Akun Pajak (opsional)</label>
                <input value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  placeholder="UUID akun dari Chart of Account"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                  Batal
                </button>
                <button onClick={save} disabled={saving || !form.kode || !form.nama}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold transition-colors">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Hapus Jenis Pajak?</h2>
              <p className="text-sm text-gray-500">Data pajak ini akan dihapus permanen dan tidak bisa dikembalikan.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Batal</button>
                <button onClick={() => remove(deleteId)} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Hapus</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  );
}
