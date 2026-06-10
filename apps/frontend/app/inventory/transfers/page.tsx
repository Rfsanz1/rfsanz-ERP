'use client';
import { useState } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { ArrowLeftRight, Plus, Search, X, Check } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draf',       color: '#94A3B8' },
  ready:     { label: 'Siap',       color: '#3B82F6' },
  done:      { label: 'Selesai',    color: '#10B981' },
  cancelled: { label: 'Dibatalkan', color: '#EF4444' },
};

const SAMPLE = [
  { id: 1, number: 'TRF-0001', from: 'Gudang Utama',    to: 'Area Produksi',           date: '2025-06-25', items: 3, total_qty: 150, unit: 'kg',   pic: 'Ahmad', status: 'done',  notes: 'Transfer untuk produksi batch A45' },
  { id: 2, number: 'TRF-0002', from: 'Gudang Kemasan',  to: 'Area Packing',            date: '2025-06-25', items: 2, total_qty: 500, unit: 'pcs',  pic: 'Budi',  status: 'ready', notes: 'Transfer kemasan untuk jadwal produksi' },
  { id: 3, number: 'TRF-0003', from: 'Gudang Utama',    to: 'Gudang Cabang Jakarta',   date: '2025-06-24', items: 5, total_qty: 80,  unit: 'unit', pic: 'Siti',  status: 'draft', notes: 'Transfer stok ke cabang' },
];

const LOCATIONS = ['Gudang Utama','Gudang Kemasan','Area Produksi','Area Packing','Gudang Jadi','Gudang Cabang Jakarta','Gudang Cabang Surabaya'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
  outline: 'none', fontSize: 12, background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

const thStyle: React.CSSProperties = {
  padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
};

export default function TransfersPage() {
  const [items, setItems]         = useState(SAMPLE);
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ from: '', to: '', date: '', notes: '', lines: [{ product: '', qty: 1, uom: 'pcs' }] });

  const filtered = items.filter(i =>
    (i.from.toLowerCase().includes(search.toLowerCase()) || i.to.toLowerCase().includes(search.toLowerCase())) &&
    (status === '' || i.status === status)
  );

  const validate = (id: number) => setItems(it => it.map(i => i.id === id ? { ...i, status: 'done' } : i));
  const save = () => {
    if (!form.from || !form.to) return;
    setItems(it => [...it, { id: it.length+1, number: `TRF-${String(it.length+1).padStart(4,'0')}`, from: form.from, to: form.to, date: form.date || new Date().toISOString().split('T')[0], items: form.lines.length, total_qty: form.lines.reduce((s,l)=>s+l.qty,0), unit:'pcs', pic:'-', status:'draft', notes:form.notes }]);
    setShowForm(false);
    setForm({ from:'', to:'', date:'', notes:'', lines:[{ product:'', qty:1, uom:'pcs' }] });
  };

  return (
    <AppShell {...INVENTORY_CONFIG} navItems={INVENTORY_NAV} activeHref="/inventory/transfers">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Transfer Stok</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Pindahkan stok antar gudang atau area produksi</p>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Buat Transfer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Total Transfer',  value: items.length,                               accent: '#6366F1' },
            { label: 'Draf',            value: items.filter(i=>i.status==='draft').length,  accent: '#94A3B8' },
            { label: 'Siap Transfer',   value: items.filter(i=>i.status==='ready').length,  accent: '#3B82F6' },
            { label: 'Selesai',         value: items.filter(i=>i.status==='done').length,   accent: '#10B981' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                placeholder="Cari lokasi asal atau tujuan…" />
            </div>
            <select value={status} onChange={e => setStatus(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface-sunken)', cursor: 'pointer' }}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['No. Transfer','Dari','Ke','Tanggal','Item','Qty Total','PIC','Catatan','Status','Aksi'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Tidak ada transfer ditemukan</td></tr>
                ) : filtered.map(item => {
                  const s = STATUS_MAP[item.status] ?? STATUS_MAP.draft;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 11, fontFamily: 'monospace', color: '#6366F1' }}>{item.number}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{item.from}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-1.5">
                          <ArrowLeftRight size={12} style={{ color: '#6366F1', flexShrink: 0 }} />
                          {item.to}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-muted)' }}>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>{item.items}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{item.total_qty.toLocaleString('id-ID')} {item.unit}</td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-muted)' }}>{item.pic}</td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.notes}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: s.color, background: s.color + '1A' }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {item.status === 'ready' && (
                          <button onClick={() => validate(item.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.10)', color: '#10B981', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            <Check size={11} /> Validasi
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
            <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 520, margin: '0 16px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.18)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Buat Transfer Stok</span>
                <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Dari Gudang *</label>
                    <select style={inputStyle} value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))}>
                      <option value="">Pilih gudang asal...</option>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Ke Gudang *</label>
                    <select style={inputStyle} value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))}>
                      <option value="">Pilih gudang tujuan...</option>
                      {LOCATIONS.filter(l => l !== form.from).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Tanggal Transfer</label>
                  <input type="date" style={inputStyle} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Catatan</label>
                  <textarea rows={2} style={{ ...inputStyle, resize: 'none' }} placeholder="Keterangan transfer…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Item Transfer</label>
                    <button onClick={() => setForm(f => ({ ...f, lines: [...f.lines, { product:'', qty:1, uom:'pcs' }] }))}
                      style={{ fontSize: 11, fontWeight: 600, color: '#6366F1', background: 'transparent', border: 'none', cursor: 'pointer' }}>+ Tambah Baris</button>
                  </div>
                  <div style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
                          {['Produk','Qty','Satuan'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {form.lines.map((line, i) => (
                          <tr key={i} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                            <td style={{ padding: '6px 8px' }}>
                              <input style={{ ...inputStyle, padding: '6px 8px' }} placeholder="Nama produk..." value={line.product} onChange={e => { const l=[...form.lines]; l[i].product=e.target.value; setForm(f=>({...f,lines:l})); }} />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input type="number" style={{ ...inputStyle, width: 60, padding: '6px 8px' }} value={line.qty} onChange={e => { const l=[...form.lines]; l[i].qty=+e.target.value; setForm(f=>({...f,lines:l})); }} />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input style={{ ...inputStyle, width: 60, padding: '6px 8px' }} value={line.uom} onChange={e => { const l=[...form.lines]; l[i].uom=e.target.value; setForm(f=>({...f,lines:l})); }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => setShowForm(false)}
                    style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                  <button onClick={save}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <ArrowLeftRight size={13} /> Simpan Transfer
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
