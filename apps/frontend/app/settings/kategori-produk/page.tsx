'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, FolderOpen, RefreshCw, AlertCircle, CheckCircle2, Zap, Building2, Pencil, X, Check } from 'lucide-react';
import { api } from '../../../lib/api';

interface Category {
  id: string;
  code: string;
  name: string;
  unitBisnis: 'elektronik' | 'bahan_bangunan' | null;
  parentId: string | null;
}

const UNIT_OPTS: { value: Category['unitBisnis']; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  { value: null,             label: 'Tidak ditentukan', color: '#6B7280', bg: '#F9FAFB',  icon: null },
  { value: 'elektronik',    label: 'KAS ELEKTRONIK',   color: '#6366F1', bg: '#F0F0FE',  icon: <Zap className="h-3.5 w-3.5" /> },
  { value: 'bahan_bangunan',label: 'KAS SULAWESI',     color: '#0891B2', bg: '#F0F9FF',  icon: <Building2 className="h-3.5 w-3.5" /> },
];

function unitLabel(u: Category['unitBisnis']) {
  return UNIT_OPTS.find(o => o.value === u) ?? UNIT_OPTS[0];
}

export default function KategoriProdukPage() {
  const [cats, setCats]         = useState<Category[]>([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null);

  const [editId, setEditId]     = useState<string | null>(null);
  const [editUnit, setEditUnit] = useState<Category['unitBisnis']>(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [newCode, setNewCode]   = useState('');
  const [newName, setNewName]   = useState('');
  const [newUnit, setNewUnit]   = useState<Category['unitBisnis']>(null);
  const [adding, setAdding]     = useState(false);
  const [showAdd, setShowAdd]   = useState(false);

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.get('/api/inventory/categories');
      setCats(d ?? []);
    } catch { flash(false, 'Gagal memuat kategori.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditUnit(cat.unitBisnis);
  };

  const cancelEdit = () => { setEditId(null); setEditUnit(null); };

  const saveEdit = async (cat: Category) => {
    setSaving(true);
    try {
      await api.put(`/api/inventory/categories/${cat.id}`, { unitBisnis: editUnit });
      setCats(prev => prev.map(c => c.id === cat.id ? { ...c, unitBisnis: editUnit } : c));
      flash(true, `Kategori "${cat.name}" berhasil diperbarui.`);
      setEditId(null);
    } catch { flash(false, 'Gagal menyimpan perubahan.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Hapus kategori "${cat.name}"? Produk dalam kategori ini akan dilepas dari kategori.`)) return;
    setDeleting(cat.id);
    try {
      await api.delete(`/api/inventory/categories/${cat.id}`);
      setCats(prev => prev.filter(c => c.id !== cat.id));
      flash(true, `Kategori "${cat.name}" dihapus.`);
    } catch { flash(false, 'Gagal menghapus kategori.'); }
    finally { setDeleting(null); }
  };

  const handleAdd = async () => {
    if (!newCode.trim() || !newName.trim()) return flash(false, 'Kode dan nama wajib diisi.');
    setAdding(true);
    try {
      const created = await api.post('/api/inventory/categories', {
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        unitBisnis: newUnit,
      });
      setCats(prev => [...prev, created]);
      setNewCode(''); setNewName(''); setNewUnit(null); setShowAdd(false);
      flash(true, 'Kategori berhasil ditambahkan.');
    } catch (e: any) {
      flash(false, e?.message ?? 'Gagal menambah kategori.');
    } finally { setAdding(false); }
  };

  const COLOR = '#7C3AED';

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${COLOR}14` }}>
            <FolderOpen className="h-5 w-5" style={{ color: COLOR }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Kategori Produk</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Atur kategori produk dan unit bisnis untuk deteksi KAS otomatis di order
            </p>
          </div>
          <button onClick={load} className="ml-auto p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Info banner */}
        <div className="mb-5 p-4 rounded-xl text-sm" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1' }}>
          <strong>Cara kerja:</strong> Produk yang memiliki kategori dengan unit bisnis <strong>KAS ELEKTRONIK</strong> atau <strong>KAS SULAWESI</strong> akan otomatis terdeteksi saat membuat order (tanpa perlu keyword). Badge <em>Elektronik</em> atau <em>Bangunan</em> akan muncul di setiap item.
        </div>

        {/* Flash */}
        {msg && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: msg.ok ? '#F0FDF4' : '#FEF2F2', color: msg.ok ? '#15803D' : '#DC2626', border: `1px solid ${msg.ok ? '#BBF7D0' : '#FECACA'}` }}>
            {msg.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {msg.text}
          </div>
        )}

        {/* Tambah baru */}
        <div className="mb-5 rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--border)', background: 'var(--surface)' }}>
          <button
            onClick={() => setShowAdd(s => !s)}
            className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors"
            style={{ color: COLOR }}
          >
            <Plus className="h-4 w-4" />
            Tambah Kategori Baru
          </button>

          {showAdd && (
            <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Kode *</label>
                  <input
                    value={newCode}
                    onChange={e => setNewCode(e.target.value.toUpperCase())}
                    placeholder="cth: ELEK, BB"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nama Kategori *</label>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="cth: Elektronik Rumah Tangga"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Unit Bisnis (KAS Otomatis)</label>
                <div className="flex flex-wrap gap-2">
                  {UNIT_OPTS.map(opt => (
                    <button key={String(opt.value)} onClick={() => setNewUnit(opt.value)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all"
                      style={{
                        borderColor: newUnit === opt.value ? opt.color : 'transparent',
                        background: newUnit === opt.value ? opt.bg : 'var(--bg-primary)',
                        color: newUnit === opt.value ? opt.color : 'var(--text-secondary)',
                      }}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleAdd} disabled={adding}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ background: COLOR }}>
                  {adding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Simpan
                </button>
                <button onClick={() => { setShowAdd(false); setNewCode(''); setNewName(''); setNewUnit(null); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabel kategori */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid var(--border)', background: 'var(--surface)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-6 w-6 animate-spin" style={{ color: 'var(--text-secondary)' }} />
            </div>
          ) : cats.length === 0 ? (
            <div className="text-center py-16 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Belum ada kategori produk. Tambahkan dari form di atas, atau buat produk dengan kategori di modul Inventory.
            </div>
          ) : (
            <div>
              {cats.map((cat, i) => {
                const isEditing = editId === cat.id;
                const u = unitLabel(isEditing ? editUnit : cat.unitBisnis);
                return (
                  <div key={cat.id}
                    className="flex items-center gap-3 px-5 py-4"
                    style={{ borderBottom: i < cats.length - 1 ? '1px solid var(--border)' : 'none' }}>

                    {/* Kode */}
                    <div className="w-16 shrink-0">
                      <span className="text-xs font-mono font-bold px-2 py-1 rounded-md"
                        style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                        {cat.code}
                      </span>
                    </div>

                    {/* Nama */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{cat.name}</p>
                      {cat.parentId && (
                        <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Sub-kategori</p>
                      )}
                    </div>

                    {/* Unit bisnis — edit atau display */}
                    {isEditing ? (
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        {UNIT_OPTS.map(opt => (
                          <button key={String(opt.value)} onClick={() => setEditUnit(opt.value)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border-2 transition-all"
                            style={{
                              borderColor: editUnit === opt.value ? opt.color : 'transparent',
                              background: editUnit === opt.value ? opt.bg : 'var(--bg-primary)',
                              color: editUnit === opt.value ? opt.color : 'var(--text-secondary)',
                            }}>
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: u.bg, color: u.color }}>
                        {u.icon} {u.label}
                      </span>
                    )}

                    {/* Aksi */}
                    {isEditing ? (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => saveEdit(cat)} disabled={saving}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background: '#F0FDF4', color: '#15803D' }}>
                          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={cancelEdit} className="p-1.5 rounded-lg transition-colors"
                          style={{ background: '#F9FAFB', color: '#6B7280' }}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          title="Edit unit bisnis">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(cat)} disabled={deleting === cat.id}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#DC2626' }}
                          title="Hapus kategori">
                          {deleting === cat.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
