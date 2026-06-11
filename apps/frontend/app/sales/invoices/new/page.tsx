'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { api } from '@/lib/api';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import CustomerSearchDropdown, { CustomerOption } from '../../../../components/ui/CustomerSearchDropdown';

const C = '#00ACC1';
const inputCls = 'w-full rounded-lg px-3 py-2 text-sm outline-none';
const inputStyle = { border: '1px solid #EDE8F5', color: '#1E1B4B', backgroundColor: '#FDFCFF' };
const Field = ({ label, required, children }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>{label}{required && <span style={{ color: '#F44336' }}>*</span>}</label>
    {children}
  </div>
);
const Section = ({ title, children }: any) => (
  <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
    <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>{title}</h3>
    {children}
  </div>
);

export default function NewInvoicePage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [resolvingCustomer, setResolvingCustomer] = useState(false);
  const [form, setForm] = useState({
    salesName: '', tanggal: new Date().toISOString().slice(0, 10),
    dueDate: '', notes: '', subtotal: 0, diskon: 0, pajak: 0, grandTotal: 0,
  });
  const [items, setItems] = useState([{ nama: '', qty: 1, harga: 0, subtotal: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleCustomerSelect = async (customer: CustomerOption) => {
    if (customer.source === 'local') {
      setCustomerId(customer.id);
      setCustomerName(customer.name);
      return;
    }
    // Kontak Kledo — resolve ke local customer ID via find-or-create
    setResolvingCustomer(true);
    try {
      const kledoId = customer.id.replace('kledo-', '');
      const res = await api.post('/customers/find-or-create', {
        name: customer.name,
        phone: customer.phone ?? undefined,
        email: customer.email ?? undefined,
        kledoId,
      });
      setCustomerId(res.data.id);
      setCustomerName(customer.name);
    } catch {
      setError('Gagal menyimpan kontak Kledo. Coba lagi.');
    } finally {
      setResolvingCustomer(false);
    }
  };

  const handleCustomerNameChange = (name: string) => {
    setCustomerName(name);
    // Reset customerId jika nama diedit manual
    setCustomerId('');
  };

  const recalc = (newItems: any[]) => {
    const sub = newItems.reduce((s, it) => s + (Number(it.qty) * Number(it.harga)), 0);
    setItems(newItems);
    setForm(f => {
      const grandTotal = sub - Number(f.diskon) + Number(f.pajak);
      return { ...f, subtotal: sub, grandTotal };
    });
  };

  const setItem = (i: number, k: string, v: any) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [k]: v, subtotal: k === 'qty' ? Number(v) * it.harga : k === 'harga' ? it.qty * Number(v) : it.subtotal } : it);
    recalc(next);
  };

  const addItem = () => recalc([...items, { nama: '', qty: 1, harga: 0, subtotal: 0 }]);
  const removeItem = (i: number) => recalc(items.filter((_, idx) => idx !== i));

  const fmt = (v: number) => new Intl.NumberFormat('id-ID').format(v);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) { setError('Nama pelanggan harus diisi'); return; }
    if (items.some(it => !it.nama)) { setError('Nama produk harus diisi'); return; }
    setLoading(true); setError('');
    try {
      // Jika belum ada customerId (ketik nama baru), buat customer dulu
      let resolvedId = customerId;
      if (!resolvedId) {
        const res = await api.post('/customers/find-or-create', { name: customerName.trim() });
        resolvedId = res.data.id;
      }
      const sub = items.reduce((s, it) => s + Number(it.qty) * Number(it.harga), 0);
      const grand = sub - Number(form.diskon) + Number(form.pajak);
      const res = await api.post('/invoices', {
        ...form,
        customerId: resolvedId,
        subtotal: sub,
        grandTotal: grand,
        items: items.map(it => ({ ...it, subtotal: Number(it.qty) * Number(it.harga) })),
      });
      router.push(`/sales/invoices/${res.data.data.id}`);
    } catch (err: any) { setError(err?.response?.data?.message || 'Terjadi kesalahan'); } finally { setLoading(false); }
  };

  if (!token) return null;

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg" style={{ border: '1px solid #EDE8F5', color: C }}><ArrowLeft className="h-4 w-4" /></button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Buat Invoice Baru</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Isi data invoice dan item penjualan</p>
          </div>
        </div>

        {error && <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: 'rgba(244,67,54,.08)', color: '#F44336', border: '1px solid rgba(244,67,54,.2)' }}>{error}</div>}

        <form onSubmit={submit} className="space-y-5">
          <Section title="Info Invoice">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Pelanggan" required>
                <div className="relative">
                  <CustomerSearchDropdown
                    value={customerName}
                    onChange={handleCustomerNameChange}
                    onSelect={handleCustomerSelect}
                    placeholder="Ketik nama pelanggan atau cari dari Kledo..."
                    accentColor={C}
                    required
                  />
                  {resolvingCustomer && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: C }}>
                      <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: `${C}40`, borderTopColor: C }} />
                      Menyimpan kontak Kledo...
                    </div>
                  )}
                  {customerId && !resolvingCustomer && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full w-fit font-semibold" style={{ backgroundColor: 'rgba(0,172,193,.1)', color: C }}>
                      ✓ Pelanggan dipilih
                    </div>
                  )}
                </div>
              </Field>
              <Field label="Sales">
                <input className={inputCls} style={inputStyle} value={form.salesName} onChange={e => set('salesName', e.target.value)} placeholder="Nama sales" />
              </Field>
              <Field label="Tanggal Invoice" required>
                <input type="date" className={inputCls} style={inputStyle} value={form.tanggal} onChange={e => set('tanggal', e.target.value)} />
              </Field>
              <Field label="Jatuh Tempo">
                <input type="date" className={inputCls} style={inputStyle} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Catatan">
                  <textarea className={inputCls} style={{ ...inputStyle, resize: 'none' }} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Catatan tambahan..." />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Item Invoice">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                    {['Produk / Nama', 'Qty', 'Harga Satuan', 'Subtotal', ''].map(h => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F5F2FB' }}>
                      <td className="py-2 pr-2">
                        <input className={inputCls} style={{ ...inputStyle, minWidth: '160px' }} value={it.nama} onChange={e => setItem(i, 'nama', e.target.value)} placeholder="Nama produk" />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" className={inputCls} style={{ ...inputStyle, width: '70px' }} value={it.qty} min={1} onChange={e => setItem(i, 'qty', e.target.value)} />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" className={inputCls} style={{ ...inputStyle, width: '130px' }} value={it.harga} min={0} onChange={e => setItem(i, 'harga', e.target.value)} />
                      </td>
                      <td className="py-2 pr-2 text-sm font-semibold whitespace-nowrap" style={{ color: '#1E1B4B' }}>Rp {fmt(Number(it.qty) * Number(it.harga))}</td>
                      <td className="py-2">
                        <button type="button" onClick={() => removeItem(i)} className="p-1.5 rounded hover:bg-red-50" style={{ color: '#F44336' }}><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs font-semibold mt-2" style={{ color: C }}>
              <Plus className="h-3.5 w-3.5" /> Tambah Baris
            </button>
          </Section>

          <Section title="Ringkasan">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Diskon (Rp)">
                <input type="number" className={inputCls} style={inputStyle} value={form.diskon} min={0} onChange={e => { set('diskon', Number(e.target.value)); setForm(f => ({ ...f, diskon: Number(e.target.value), grandTotal: f.subtotal - Number(e.target.value) + f.pajak })); }} />
              </Field>
              <Field label="Pajak / PPN (Rp)">
                <input type="number" className={inputCls} style={inputStyle} value={form.pajak} min={0} onChange={e => { setForm(f => ({ ...f, pajak: Number(e.target.value), grandTotal: f.subtotal - f.diskon + Number(e.target.value) })); }} />
              </Field>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Grand Total</label>
                <div className="rounded-lg px-3 py-2 text-lg font-bold" style={{ backgroundColor: 'rgba(0,172,193,.08)', color: C }}>
                  Rp {fmt(Math.max(0, form.subtotal - Number(form.diskon) + Number(form.pajak)))}
                </div>
              </div>
            </div>
          </Section>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => router.back()} className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#9CA3AF' }}>Batal</button>
            <button type="submit" disabled={loading || resolvingCustomer} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: C }}>
              {loading ? 'Menyimpan...' : 'Simpan Invoice'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
