'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Tag, RefreshCw, AlertCircle, CheckCircle2, Zap, Building2 } from 'lucide-react';

interface KwRow { id: number; keyword: string; kategori: 'elektronik' | 'bahan_bangunan'; }

const DEFAULT_ELEKTRO = [
  'mesin cuci', 'chest freezer', 'freezer', 'kulkas', 'lemari es', 'air conditioner',
  'televisi', 'blender', 'dispenser', 'rice cooker', 'magic com', 'setrika', 'kipas angin',
  'pompa air', 'jet pump', 'water heater', 'kompor listrik', 'oven listrik', 'microwave',
  'laptop', 'komputer', 'handphone', 'smartphone', 'printer', 'speaker', 'refrigerator',
  'dryer', 'washing machine', 'inverter', 'genset', 'vacuum', 'mixer listrik', 'juicer',
  'water pump', 'showcase', 'chest', 'deep freezer', 'lemari pendingin',
];
const DEFAULT_BANGUNAN = [
  'semen', 'pasir', 'pipa', 'cat tembok', 'cat kayu', 'cat besi', 'keramik', 'genteng',
  'baja', 'triplek', 'plywood', 'kabel listrik', 'saklar', 'stop kontak', 'kran', 'seng',
  'galvalum', 'plafon', 'hollow', 'bondek', 'wiremesh', 'granit', 'marmer', 'atap',
  'waterproofing', 'jendela', 'kloset', 'wastafel', 'shower', 'beton', 'mortar',
  'lem keramik', 'talang', 'list plafon',
];

const ACCENT = { elektronik: '#6366F1', bahan_bangunan: '#0891B2' } as const;
const BG     = { elektronik: '#F0F0FE',  bahan_bangunan: '#F0F9FF'  } as const;

export default function KeywordsPage() {
  const [rows, setRows]     = useState<KwRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  const [newKw, setNewKw]         = useState('');
  const [newKat, setNewKat]       = useState<'elektronik' | 'bahan_bangunan'>('elektronik');
  const [adding, setAdding]       = useState(false);
  const [deleting, setDeleting]   = useState<number | null>(null);

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/settings/keywords');
      const d = await r.json();
      setRows(d.data ?? []);
    } catch { flash(false, 'Gagal memuat keyword.'); }
    finally { setLoading(false); }
  };

  const add = async () => {
    if (!newKw.trim()) return;
    setAdding(true);
    try {
      const r = await fetch('/api/settings/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKw.trim(), kategori: newKat }),
      });
      const d = await r.json();
      if (d.error) { flash(false, d.error); return; }
      flash(true, `Keyword "${newKw.trim()}" ditambahkan!`);
      setNewKw('');
      await load();
    } catch { flash(false, 'Gagal menambah keyword.'); }
    finally { setAdding(false); }
  };

  const del = async (id: number, keyword: string) => {
    setDeleting(id);
    try {
      await fetch('/api/settings/keywords', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      flash(true, `"${keyword}" dihapus.`);
      setRows(r => r.filter(x => x.id !== id));
    } catch { flash(false, 'Gagal menghapus.'); }
    finally { setDeleting(null); }
  };

  useEffect(() => { load(); }, []);

  const elektroRows   = rows.filter(r => r.kategori === 'elektronik');
  const bangunanRows  = rows.filter(r => r.kategori === 'bahan_bangunan');

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#1E1B4B' }}>Deteksi Kategori Produk</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
            Keyword yang digunakan untuk otomatis mendeteksi unit produk saat buat order baru.
            Pencocokan dilakukan pada nama barang (tidak case-sensitive).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {msg && (
            <span className="flex items-center gap-1 text-xs font-medium"
              style={{ color: msg.ok ? '#16A34A' : '#DC2626' }}>
              {msg.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {msg.text}
            </span>
          )}
          <button onClick={load}
            className="p-2 rounded-lg"
            style={{ background: '#F3F4F6', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#6366F1')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Add keyword form */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
          Tambah Keyword Baru
        </p>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <input
            type="text"
            value={newKw}
            onChange={e => setNewKw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Contoh: mesin bor, lemari kaca, pipa galvanis..."
            className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none"
            style={{ border: '1.5px solid #E5E7EB', background: '#FAFAFA', color: '#1E1B4B', minWidth: 200 }}
            onFocus={e => (e.target.style.borderColor = '#6366F1')}
            onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
          />
          {/* Kategori toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1.5px solid #E5E7EB', flexShrink: 0 }}>
            {(['elektronik', 'bahan_bangunan'] as const).map(k => {
              const active = newKat === k;
              const label = k === 'elektronik' ? '⚡ Elektronik' : '🏗 Bangunan';
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setNewKat(k)}
                  className="px-3 py-2 text-xs font-semibold transition-colors"
                  style={{
                    background: active ? ACCENT[k] : '#fff',
                    color: active ? '#fff' : '#6B7280',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button
            onClick={add}
            disabled={adding || !newKw.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: adding || !newKw.trim() ? '#D1D5DB' : '#6366F1',
              border: 'none',
              cursor: adding || !newKw.trim() ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
          >
            {adding ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
            Tambah
          </button>
        </div>
        <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
          Tip: gunakan kata kunci yang spesifik. Misal "chest freezer" lebih baik dari sekedar "freezer".
        </p>
      </div>

      {/* Elektronik section */}
      <KwSection
        label="⚡ Elektronik"
        desc="Barang elektronik → set lunas ke KAS ELEKTRONIK"
        color={ACCENT.elektronik}
        bg={BG.elektronik}
        defaultKws={DEFAULT_ELEKTRO}
        customKws={elektroRows}
        deleting={deleting}
        onDelete={del}
        loading={loading}
      />

      {/* Bahan Bangunan section */}
      <KwSection
        label="🏗 Bahan Bangunan"
        desc="Material bangunan → set lunas ke KAS SULAWESI"
        color={ACCENT.bahan_bangunan}
        bg={BG.bahan_bangunan}
        defaultKws={DEFAULT_BANGUNAN}
        customKws={bangunanRows}
        deleting={deleting}
        onDelete={del}
        loading={loading}
      />
    </div>
  );
}

function KwSection({
  label, desc, color, bg, defaultKws, customKws, deleting, onDelete, loading,
}: {
  label: string; desc: string; color: string; bg: string;
  defaultKws: string[]; customKws: KwRow[];
  deleting: number | null;
  onDelete: (id: number, keyword: string) => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${color}30` }}>
      {/* Section header */}
      <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: bg }}>
        <div>
          <p className="text-sm font-bold" style={{ color }}>{label}</p>
          <p className="text-[11px]" style={{ color: '#6B7280' }}>{desc}</p>
        </div>
        <div className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: color + '20', color }}>
          {defaultKws.length} default + {customKws.length} custom
        </div>
      </div>

      <div className="p-5 space-y-4" style={{ background: '#fff' }}>
        {/* Default keywords (read-only) */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>
            Default (tidak bisa dihapus)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {defaultKws.map(kw => (
              <span key={kw}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Custom keywords */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>
            Custom (ditambah manual)
          </p>
          {loading ? (
            <div className="h-8 rounded-lg animate-pulse" style={{ background: '#F3F4F6' }} />
          ) : customKws.length === 0 ? (
            <p className="text-[12px] italic" style={{ color: '#9CA3AF' }}>
              Belum ada keyword custom — tambahkan di atas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {customKws.map(row => (
                <span key={row.id}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: color + '15', color, border: `1px solid ${color}30` }}>
                  {row.keyword}
                  <button
                    onClick={() => onDelete(row.id, row.keyword)}
                    disabled={deleting === row.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color, padding: 0, opacity: deleting === row.id ? 0.5 : 1 }}
                  >
                    {deleting === row.id
                      ? <RefreshCw size={10} className="animate-spin" />
                      : <Trash2 size={10} />
                    }
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
