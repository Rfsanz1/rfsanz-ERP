'use client';

import { useState, useEffect, useCallback } from 'react';
import ModernLayout from '../../../components/layout/ModernLayout';
import { Truck, Plus, CheckCircle, Clock, Search, X, Info } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function fmt(n: number) { return new Intl.NumberFormat('id-ID').format(Math.round(n)); }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }

const SPLIT_METHODS = [
  { value: 'BY_QTY',    label: 'Berdasarkan Qty',   desc: 'Biaya dibagi proporsional ke jumlah unit' },
  { value: 'BY_VALUE',  label: 'Berdasarkan Nilai',  desc: 'Biaya dibagi proporsional ke nilai PO item' },
  { value: 'BY_WEIGHT', label: 'Berdasarkan Berat',  desc: 'Biaya dibagi proporsional ke berat (= qty)' },
];

const STATUS_CONFIG = {
  draft:   { label: 'Draft',   color: 'bg-gray-100 text-gray-600',   icon: Clock },
  applied: { label: 'Applied', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

interface LandedCost {
  id: string; purchaseId: string; deskripsi: string;
  amount: number; splitMethod: string; status: string;
  createdAt: string;
  items?: { id: string; productId: string; qty: number; alokasiBiaya: number; product?: { name: string; sku: string } }[];
}

interface CostLine { deskripsi: string; amount: string; splitMethod: string }

export default function LandedCostPage() {
  const [costs, setCosts] = useState<LandedCost[]>([]);
  const [purchaseOrders, setPOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState('');
  const [costLines, setCostLines] = useState<CostLine[]>([
    { deskripsi: 'Ongkos Kirim', amount: '', splitMethod: 'BY_VALUE' },
  ]);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lcRes, poRes] = await Promise.all([
        fetch(`${API}/inventory/landed-costs?limit=50`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/purchasing/purchase-orders?limit=100&status=confirmed`, { credentials: 'include' }).then(r => r.json()).catch(() => ({ data: [] })),
      ]);
      setCosts(Array.isArray(lcRes.data) ? lcRes.data : []);
      setPOs(Array.isArray(poRes.data) ? poRes.data : []);
    } catch { setCosts([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = costs.filter(c =>
    c.deskripsi.toLowerCase().includes(search.toLowerCase()) ||
    c.purchaseId.toLowerCase().includes(search.toLowerCase())
  );

  async function apply() {
    if (!selectedPO || costLines.some(l => !l.deskripsi || !l.amount)) return;
    setSaving(true);
    try {
      await fetch(`${API}/inventory/landed-costs/apply`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: selectedPO,
          costs: costLines.map(l => ({ deskripsi: l.deskripsi, amount: Number(l.amount), splitMethod: l.splitMethod })),
        }),
      });
      setShowForm(false);
      setSelectedPO('');
      setCostLines([{ deskripsi: 'Ongkos Kirim', amount: '', splitMethod: 'BY_VALUE' }]);
      await load();
    } finally { setSaving(false); }
  }

  async function validate(id: string) {
    await fetch(`${API}/inventory/landed-costs/${id}/validate`, { method: 'POST', credentials: 'include' });
    await load();
  }

  function addLine() {
    setCostLines(prev => [...prev, { deskripsi: '', amount: '', splitMethod: 'BY_VALUE' }]);
  }

  function removeLine(i: number) {
    setCostLines(prev => prev.filter((_, idx) => idx !== i));
  }

  const totalAmount = costLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  return (
    <ModernLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Landed Cost</h1>
            <p className="text-sm text-gray-500 mt-0.5">Alokasikan biaya tambahan (ongkir, bea cukai, dll) ke harga pokok produk</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">
            <Plus className="w-4 h-4" /> Tambah Landed Cost
          </button>
        </div>

        {/* Info box */}
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Cara kerja:</strong> Biaya yang ditambahkan akan dialokasikan ke setiap item PO sesuai metode pembagian, lalu menaikkan <em>Average Cost</em> produk secara otomatis. Jurnal akuntansi dibuat otomatis (Debit Persediaan / Kredit Hutang).
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari landed cost..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              Belum ada landed cost. Klik "Tambah Landed Cost" untuk mulai.
            </div>
          ) : filtered.map(lc => {
            const sc = STATUS_CONFIG[lc.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
            const Icon = sc.icon;
            const isExpanded = expanded === lc.id;
            return (
              <div key={lc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{lc.deskripsi}</div>
                      <div className="text-xs text-gray-400">
                        PO: <span className="font-mono">{lc.purchaseId.slice(0, 12)}…</span> · {fmtDate(lc.createdAt)}
                        · {SPLIT_METHODS.find(m => m.value === lc.splitMethod)?.label}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">Rp {fmt(Number(lc.amount))}</div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${sc.color}`}>
                        <Icon className="w-3 h-3" /> {sc.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {lc.status === 'draft' && (
                      <button onClick={() => validate(lc.id)}
                        className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">
                        Validasi
                      </button>
                    )}
                    <button onClick={() => setExpanded(isExpanded ? null : lc.id)}
                      className="px-3 py-1.5 text-xs border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg">
                      {isExpanded ? 'Tutup' : 'Detail'}
                    </button>
                  </div>
                </div>

                {isExpanded && lc.items && lc.items.length > 0 && (
                  <div className="border-t border-gray-100 px-5 pb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase my-3">Alokasi per Produk</p>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-100">
                          <th className="text-left py-1.5 font-medium">Produk</th>
                          <th className="text-right py-1.5 font-medium">Qty</th>
                          <th className="text-right py-1.5 font-medium">Alokasi Biaya</th>
                          <th className="text-right py-1.5 font-medium">Per Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {lc.items.map(item => (
                          <tr key={item.id} className="text-gray-600">
                            <td className="py-2">{item.product?.name ?? item.productId.slice(0, 12)}</td>
                            <td className="py-2 text-right">{fmt(item.qty)}</td>
                            <td className="py-2 text-right font-semibold text-blue-700">Rp {fmt(Number(item.alokasiBiaya))}</td>
                            <td className="py-2 text-right text-gray-500">Rp {fmt(Number(item.qty) > 0 ? Number(item.alokasiBiaya) / Number(item.qty) : 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Tambah Landed Cost</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Purchase Order *</label>
                <select value={selectedPO} onChange={e => setSelectedPO(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="">Pilih PO...</option>
                  {purchaseOrders.map(po => <option key={po.id} value={po.id}>{po.noPo} - {po.supplier?.name}</option>)}
                  {purchaseOrders.length === 0 && (
                    <option value="manual" disabled={false}>Input ID manual...</option>
                  )}
                </select>
                {purchaseOrders.length === 0 && (
                  <input value={selectedPO} onChange={e => setSelectedPO(e.target.value)}
                    placeholder="Paste Purchase Order ID..."
                    className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500 font-semibold uppercase">Baris Biaya</label>
                  <button onClick={addLine} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Tambah Baris
                  </button>
                </div>
                <div className="space-y-3">
                  {costLines.map((line, i) => (
                    <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Biaya #{i + 1}</span>
                        {costLines.length > 1 && (
                          <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input value={line.deskripsi} onChange={e => setCostLines(prev => prev.map((l, idx) => idx === i ? { ...l, deskripsi: e.target.value } : l))}
                        placeholder="Deskripsi (contoh: Ongkos Kirim, Bea Cukai)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" value={line.amount} onChange={e => setCostLines(prev => prev.map((l, idx) => idx === i ? { ...l, amount: e.target.value } : l))}
                          placeholder="Jumlah (Rp)"
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                        <select value={line.splitMethod} onChange={e => setCostLines(prev => prev.map((l, idx) => idx === i ? { ...l, splitMethod: e.target.value } : l))}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                          {SPLIT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                      <p className="text-xs text-gray-400">{SPLIT_METHODS.find(m => m.value === line.splitMethod)?.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-lg">
                <span className="text-sm font-semibold text-blue-800">Total Biaya</span>
                <span className="text-lg font-bold text-blue-900">Rp {fmt(totalAmount)}</span>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={apply} disabled={saving || !selectedPO || costLines.some(l => !l.deskripsi || !l.amount)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold">
                {saving ? 'Memproses...' : 'Terapkan & Buat Jurnal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
