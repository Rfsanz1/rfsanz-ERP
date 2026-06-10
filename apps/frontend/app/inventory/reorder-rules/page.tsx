'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { RefreshCw, Plus, X, AlertTriangle, ShoppingCart, Check } from 'lucide-react';

const C = INVENTORY_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE = [
  { id: 1, product: 'Bahan Baku PP Grade A', location: 'Gudang Utama', current_stock: 250, min_qty: 300, max_qty: 1000, order_qty: 500, route: 'Purchase', supplier: 'PT. Supplier Utama', active: true, triggered: true },
  { id: 2, product: 'Kemasan Karton 20L', location: 'Gudang Kemasan', current_stock: 500, min_qty: 200, max_qty: 2000, order_qty: 1000, route: 'Purchase', supplier: 'CV. Kemasan Jaya', active: true, triggered: false },
  { id: 3, product: 'Label Produk', location: 'Gudang Kemasan', current_stock: 800, min_qty: 500, max_qty: 5000, order_qty: 2000, route: 'Purchase', supplier: 'Percetakan ABC', active: true, triggered: false },
  { id: 4, product: 'Produk Jadi A', location: 'Gudang Jadi', current_stock: 50, min_qty: 100, max_qty: 500, order_qty: 200, route: 'Manufacture', supplier: '-', active: true, triggered: true },
  { id: 5, product: 'Bahan Baku Resin', location: 'Gudang Utama', current_stock: 1200, min_qty: 200, max_qty: 2000, order_qty: 800, route: 'Purchase', supplier: 'CV. Bahan Baku Jaya', active: false, triggered: false },
];

export default function ReorderRulesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product: '', location: '', min_qty: '', max_qty: '', order_qty: '', route: 'Purchase', supplier: '' });

  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;

  const triggered = items.filter(i => i.triggered && i.active);
  const toggleActive = (id: number) => setItems(it => it.map(i => i.id === id ? { ...i, active: !i.active } : i));

  const save = () => {
    if (!form.product) return;
    setItems(it => [...it, { id: it.length + 1, ...form, current_stock: 0, min_qty: +form.min_qty, max_qty: +form.max_qty, order_qty: +form.order_qty, active: true, triggered: false }]);
    setShowForm(false);
    setForm({ product: '', location: '', min_qty: '', max_qty: '', order_qty: '', route: 'Purchase', supplier: '' });
  };

  return (
    <AppShell {...INVENTORY_CONFIG} navItems={INVENTORY_NAV} activeHref="/inventory/reorder-rules">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Reorder Rules</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Atur aturan pemesanan ulang otomatis saat stok mencapai minimum</p>
          </div>
          <div className="flex gap-2">
            {triggered.length > 0 && (
              <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#EA5455' }}>
                <ShoppingCart className="h-4 w-4" /> Jalankan {triggered.length} Reorder
              </button>
            )}
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
              <Plus className="h-4 w-4" /> Tambah Rule
            </button>
          </div>
        </div>

        {triggered.length > 0 && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(234,84,85,.06)', border: '1.5px solid rgba(234,84,85,.2)' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: '#EA5455' }} />
            <p className="text-sm" style={{ color: '#C62828' }}>
              <span className="font-bold">{triggered.length} produk</span> telah mencapai stok minimum dan perlu diorder ulang.
            </p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Rules', value: items.length, color: C },
            { label: 'Aktif', value: items.filter(i => i.active).length, color: '#4CAF50' },
            { label: 'Perlu Diorder', value: triggered.length, color: '#EA5455' },
            { label: 'Via Purchase', value: items.filter(i => i.route === 'Purchase').length, color: '#2196F3' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Produk', 'Lokasi', 'Stok Saat Ini', 'Min Qty', 'Max Qty', 'Order Qty', 'Route', 'Supplier', 'Status', 'Aktif'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>
                      <div className="flex items-center gap-2">
                        {item.triggered && item.active && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#EA5455' }} />}
                        {item.product}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.location}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: item.current_stock < item.min_qty ? '#EA5455' : '#4CAF50' }}>
                      {item.current_stock}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.min_qty}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.max_qty}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: C }}>{item.order_qty}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: item.route === 'Purchase' ? 'rgba(33,150,243,.1)' : 'rgba(109,40,217,.1)', color: item.route === 'Purchase' ? '#2196F3' : '#6D28D9' }}>
                        {item.route}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.supplier}</td>
                    <td className="px-4 py-3">
                      {item.triggered && item.active ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(234,84,85,.1)', color: '#EA5455' }}>Perlu Order</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(76,175,80,.1)', color: '#4CAF50' }}>Aman</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(item.id)} className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors" style={{ backgroundColor: item.active ? C : '#D1D5DB' }}>
                        <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" style={{ transform: item.active ? 'translateX(18px)' : 'translateX(2px)' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Reorder Rule</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'product', label: 'Produk *', placeholder: 'Nama produk...' },
                  { key: 'location', label: 'Lokasi', placeholder: 'Gudang...' },
                  { key: 'min_qty', label: 'Min. Stok (trigger)', placeholder: '0', type: 'number' },
                  { key: 'max_qty', label: 'Max. Stok', placeholder: '0', type: 'number' },
                  { key: 'order_qty', label: 'Qty Pemesanan', placeholder: '0', type: 'number' },
                  { key: 'supplier', label: 'Supplier (jika Purchase)', placeholder: 'Nama supplier...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Route</label>
                  <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))}>
                    <option value="Purchase">Purchase (Beli dari Supplier)</option>
                    <option value="Manufacture">Manufacture (Produksi Sendiri)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <RefreshCw className="h-4 w-4" /> Simpan Rule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
