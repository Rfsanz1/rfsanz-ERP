'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

const TYPE_OPTIONS = [
  { value: 'customer', label: 'Pelanggan' },
  { value: 'supplier', label: 'Pemasok' },
  { value: 'both',     label: 'Keduanya' },
  { value: 'employee', label: 'Karyawan' },
  { value: 'other',    label: 'Lainnya' },
];

const TERM_OPTIONS = [
  { value: 0,  label: 'Cash (0 hari)' },
  { value: 7,  label: '7 hari' },
  { value: 14, label: '14 hari' },
  { value: 30, label: '30 hari' },
  { value: 45, label: '45 hari' },
  { value: 60, label: '60 hari' },
];

interface Props { initial?: any; mode: 'create' | 'edit'; id?: string; }

const ACCENT = '#7367F0';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>
        {label}{required && <span className="ml-0.5" style={{ color: '#EF4444' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors";
const inputStyle = { border: '1px solid #EDE8F5', color: '#1E1B4B', backgroundColor: '#FDFCFF' };

export default function ContactForm({ initial, mode, id }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', type: ['customer'], email: '', phone: '', mobile: '',
    address: '', city: '', province: '', postalCode: '', country: 'Indonesia',
    npwp: '', nik: '', termOfPayment: 0, creditLimit: 0, currency: 'IDR',
    discountPercent: 0, bankName: '', bankAccountNo: '', bankAccountName: '',
    notes: '', isActive: true, ...initial,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const toggleType = (t: string) => {
    const cur: string[] = form.type || [];
    set('type', cur.includes(t) ? cur.filter((x: string) => x !== t) : [...cur, t]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError('Nama wajib diisi'); return; }
    if (!form.type?.length) { setError('Pilih minimal satu tipe kontak'); return; }
    setLoading(true); setError('');
    try {
      if (mode === 'create') {
        const res = await api.post('/contacts', form);
        router.push(`/contacts/${res.data.id}`);
      } else {
        await api.put(`/contacts/${id}`, form);
        router.push(`/contacts/${id}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Terjadi kesalahan');
    } finally { setLoading(false); }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
      <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: 'rgba(239,68,68,.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)' }}>
          {error}
        </div>
      )}

      <Section title="Info Dasar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nama Kontak" required>
            <input className={inputCls} style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nama lengkap / perusahaan" />
          </Field>
          <Field label="Tipe Kontak" required>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const active = (form.type || []).includes(opt.value);
                return (
                  <button type="button" key={opt.value} onClick={() => toggleType(opt.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={active ? { backgroundColor: ACCENT, color: 'white' } : { border: '1px solid #EDE8F5', color: '#9CA3AF' }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Email">
            <input type="email" className={inputCls} style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@perusahaan.com" />
          </Field>
          <Field label="Telepon">
            <input className={inputCls} style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+62 xxx xxxx xxxx" />
          </Field>
          <Field label="HP / WhatsApp">
            <input className={inputCls} style={inputStyle} value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="+62 xxx xxxx xxxx" />
          </Field>
          <Field label="Catatan">
            <input className={inputCls} style={inputStyle} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Catatan tambahan" />
          </Field>
        </div>
      </Section>

      <Section title="Alamat">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Field label="Alamat">
              <textarea className={inputCls} style={{ ...inputStyle, resize: 'none' }} rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Jalan, nomor, RT/RW" />
            </Field>
          </div>
          <Field label="Kota"><input className={inputCls} style={inputStyle} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Jakarta" /></Field>
          <Field label="Provinsi"><input className={inputCls} style={inputStyle} value={form.province} onChange={e => set('province', e.target.value)} placeholder="DKI Jakarta" /></Field>
          <Field label="Kode Pos"><input className={inputCls} style={inputStyle} value={form.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="12345" /></Field>
          <Field label="Negara"><input className={inputCls} style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Indonesia" /></Field>
        </div>
      </Section>

      <Section title="Info Bisnis & Pajak">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="NPWP"><input className={inputCls} style={inputStyle} value={form.npwp} onChange={e => set('npwp', e.target.value)} placeholder="00.000.000.0-000.000" /></Field>
          <Field label="NIK"><input className={inputCls} style={inputStyle} value={form.nik} onChange={e => set('nik', e.target.value)} placeholder="1234567890123456" /></Field>
        </div>
      </Section>

      <Section title="Bank">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Nama Bank"><input className={inputCls} style={inputStyle} value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="BCA" /></Field>
          <Field label="No. Rekening"><input className={inputCls} style={inputStyle} value={form.bankAccountNo} onChange={e => set('bankAccountNo', e.target.value)} placeholder="1234567890" /></Field>
          <Field label="Atas Nama"><input className={inputCls} style={inputStyle} value={form.bankAccountName} onChange={e => set('bankAccountName', e.target.value)} placeholder="PT Contoh" /></Field>
        </div>
      </Section>

      <Section title="Pengaturan Default">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Termin Pembayaran">
            <select className={inputCls} style={inputStyle} value={form.termOfPayment} onChange={e => set('termOfPayment', Number(e.target.value))}>
              {TERM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Limit Kredit (IDR)">
            <input type="number" className={inputCls} style={inputStyle} value={form.creditLimit} onChange={e => set('creditLimit', Number(e.target.value))} min={0} />
          </Field>
          <Field label="Diskon Default (%)">
            <input type="number" className={inputCls} style={inputStyle} value={form.discountPercent} onChange={e => set('discountPercent', Number(e.target.value))} min={0} max={100} />
          </Field>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button type="button" onClick={() => set('isActive', !form.isActive)}
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
            style={{ backgroundColor: form.isActive ? ACCENT : '#D1D5DB' }}>
            <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
              style={{ transform: form.isActive ? 'translateX(18px)' : 'translateX(2px)' }} />
          </button>
          <span className="text-xs font-medium" style={{ color: '#1E1B4B' }}>Kontak Aktif</span>
        </div>
      </Section>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition"
          style={{ border: '1.5px solid #EDE8F5', color: '#9CA3AF' }}>
          Batal
        </button>
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ backgroundColor: ACCENT }}>
          {loading ? 'Menyimpan...' : mode === 'create' ? 'Simpan Kontak' : 'Update Kontak'}
        </button>
      </div>
    </form>
  );
}
