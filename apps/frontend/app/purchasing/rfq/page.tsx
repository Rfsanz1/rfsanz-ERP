'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { PURCHASING_CONFIG, PURCHASING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { FileText, Plus, Search, X, Send, Check, Trash2 } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draf',          color: '#94A3B8' },
  sent:      { label: 'Terkirim',      color: '#3B82F6' },
  received:  { label: 'Diterima',      color: '#F59E0B' },
  confirmed: { label: 'Dikonfirmasi',  color: '#10B981' },
  cancelled: { label: 'Dibatalkan',    color: '#EF4444' },
};

const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const SAMPLE = [
  { id: 1, number: 'RFQ-0001', supplier: 'PT. Supplier Utama',    date: '2025-06-15', deadline: '2025-06-22', items: 3, total: 45000000,  status: 'sent' },
  { id: 2, number: 'RFQ-0002', supplier: 'CV. Bahan Baku Jaya',   date: '2025-06-18', deadline: '2025-06-25', items: 5, total: 78000000,  status: 'draft' },
  { id: 3, number: 'RFQ-0003', supplier: 'Distributor Nasional',  date: '2025-06-20', deadline: '2025-06-27', items: 2, total: 125000000, status: 'received' },
  { id: 4, number: 'RFQ-0004', supplier: 'PT. Logistik Prima',    date: '2025-06-10', deadline: '2025-06-17', items: 4, total: 32000000,  status: 'confirmed' },
];

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

export default function RFQPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  const [items, setItems]     = useState(SAMPLE as any[]);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    supplier: '', deadline: '', notes: '',
    lines: [{ product: '', qty: 1, uom: 'pcs', description: '' }],
  });

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const filtered = items.filter(i =>
    i.supplier.toLowerCase().includes(search.toLowerCase()) &&
    (status === '' || i.status === status)
  );

  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, { product: '', qty: 1, uom: 'pcs', description: '' }] }));

  const save = () => {
    const newRFQ = { id: items.length + 1, number: `RFQ-${String(items.length + 1).padStart(4, '0')}`, supplier: form.supplier, date: new Date().toISOString().split('T')[0], deadline: form.deadline, items: form.lines.length, total: 0, status: 'draft' };
    setItems(it => [newRFQ, ...it]);
    setShowForm(false);
    setForm({ supplier: '', deadline: '', notes: '', lines: [{ product: '', qty: 1, uom: 'pcs', description: '' }] });
  };

  return (
    <AppShell {...PURCHASING_CONFIG} navItems={PURCHASING_NAV} activeHref="/purchasing/rfq">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Request for Quotation</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Permintaan penawaran harga ke supplier</p>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Buat RFQ
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total RFQ',     value: items.length,                                 accent: '#6366F1' },
            { label: 'Draf',          value: items.filter(i => i.status === 'draft').length,     accent: '#94A3B8' },
            { label: 'Terkirim',      value: items.filter(i => i.status === 'sent').length,      accent: '#3B82F6' },
            { label: 'Dikonfirmasi',  value: items.filter(i => i.status === 'confirmed').length, accent: '#10B981' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari supplier…"
                style={{ ...inputStyle, paddingLeft: 34 }} />
            </div>
            <select value={status} onChange={e => setStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', outline: 'none', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface-sunken)', cursor: 'pointer' }}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['No. RFQ','Supplier','Tanggal','Deadline','Jml. Item','Total','Status','Aksi'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const s = STATUS_MAP[item.status] ?? STATUS_MAP.draft;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#6366F1', fontSize: 11, fontFamily: 'monospace' }}>{item.number}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{item.supplier}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(item.date)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(item.deadline)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>{item.items}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{item.total > 0 ? fmt(item.total) : '–'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: s.color, background: s.color + '1A', border: `1px solid ${s.color}30` }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-1">
                          {item.status === 'draft' && (
                            <button title="Kirim ke supplier" style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: '#3B82F6', cursor: 'pointer' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.10)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                              <Send size={13} />
                            </button>
                          )}
                          {item.status === 'received' && (
                            <button title="Konfirmasi jadi PO" style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: '#10B981', cursor: 'pointer' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.10)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                              <Check size={13} />
                            </button>
                          )}
                          <button title="Hapus" style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.18)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Buat RFQ Baru</span>
                <button onClick={() => setShowForm(false)} style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Supplier *</label>
                    <input style={inputStyle} placeholder="Nama supplier…" value={form.supplier}
                      onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                      onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Deadline Penawaran</label>
                    <input type="date" style={inputStyle} value={form.deadline}
                      onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Item yang Diminta</label>
                    <button onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#6366F1', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                      <Plus size={12} /> Tambah Item
                    </button>
                  </div>
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
                          {['Produk / Material','Qty','Satuan','Keterangan'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {form.lines.map((line, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px 8px' }}>
                              <input style={{ ...inputStyle, padding: '6px 10px', fontSize: 12 }} placeholder="Nama produk…" value={line.product}
                                onChange={e => { const l = [...form.lines]; l[i].product = e.target.value; setForm(f => ({ ...f, lines: l })); }} />
                            </td>
                            <td style={{ padding: '6px 8px', width: 70 }}>
                              <input type="number" style={{ ...inputStyle, padding: '6px 10px', fontSize: 12, width: 60 }} value={line.qty}
                                onChange={e => { const l = [...form.lines]; l[i].qty = +e.target.value; setForm(f => ({ ...f, lines: l })); }} />
                            </td>
                            <td style={{ padding: '6px 8px', width: 70 }}>
                              <input style={{ ...inputStyle, padding: '6px 10px', fontSize: 12, width: 60 }} value={line.uom}
                                onChange={e => { const l = [...form.lines]; l[i].uom = e.target.value; setForm(f => ({ ...f, lines: l })); }} />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input style={{ ...inputStyle, padding: '6px 10px', fontSize: 12 }} placeholder="Keterangan…" value={line.description}
                                onChange={e => { const l = [...form.lines]; l[i].description = e.target.value; setForm(f => ({ ...f, lines: l })); }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Catatan untuk Supplier</label>
                  <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Syarat, spesifikasi, atau catatan khusus…" value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                <div className="flex justify-end gap-3" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => setShowForm(false)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                  <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#94A3B8', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <FileText size={13} /> Simpan Draf
                  </button>
                  <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Send size={13} /> Kirim ke Supplier
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
