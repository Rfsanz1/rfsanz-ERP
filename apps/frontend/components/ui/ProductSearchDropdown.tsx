'use client';

import { useState, useRef, useCallback } from 'react';
import { Search, Package } from 'lucide-react';
import { api } from '../../lib/api';

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  hargaJual: number;
  stok: number;
  kledoProductId?: string | null;
  unit?: { name: string } | null;
  source?: 'local' | 'kledo';
}

interface Props {
  value: string;
  onSelect: (product: ProductOption) => void;
  onChange?: (name: string) => void;
  placeholder?: string;
  accentColor?: string;
  disabled?: boolean;
}

const fmtRp = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export default function ProductSearchDropdown({
  value,
  onSelect,
  onChange,
  placeholder = 'Cari nama atau SKU produk...',
  accentColor = '#00ACC1',
  disabled = false,
}: Props) {
  const [suggestions, setSuggestions] = useState<ProductOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q || q.length < 2) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [localRes, kledoRes] = await Promise.allSettled([
          // Local inventory: param search, response { data: [...] } atau langsung array
          api.get('/inventory/products', { params: { search: q, limit: 30 } }),
          // Kledo: param name (bukan search), response { success, data: { data: [...] } }
          api.get('/kledo/products', { params: { name: q, per_page: 30 } }),
        ]);

        // Parse local — bisa array langsung atau { data: [...] }
        const localRaw: any[] =
          localRes.status === 'fulfilled'
            ? (() => {
                const d = localRes.value.data;
                return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
              })()
            : [];

        const localList: ProductOption[] = localRaw.map((p: any) => ({
          id: String(p.id),
          name: p.name ?? '',
          sku: p.sku ?? p.code ?? '',
          hargaJual: Number(p.hargaJual ?? p.price ?? 0),
          stok: Number(p.stok ?? p.stock ?? p.qty ?? 0),
          kledoProductId: p.kledoProductId ?? null,
          unit: p.unit ?? null,
          source: 'local' as const,
        }));

        // Parse Kledo — response: { success, data: { data: [...], total, ... } }
        const kledoRaw: any[] =
          kledoRes.status === 'fulfilled'
            ? (() => {
                const d = kledoRes.value.data;
                const inner = d?.data ?? d;
                return Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [];
              })()
            : [];

        const kledoList: ProductOption[] = kledoRaw.map((p: any) => ({
          id: `kledo-${p.id}`,
          name: p.name ?? '',
          sku: p.code ?? '',
          hargaJual: Number(p.price ?? 0),
          stok: 0,
          kledoProductId: String(p.id),
          unit: p.unit ? { name: String(p.unit) } : null,
          source: 'kledo' as const,
        }));

        // Dedup: hilangkan dari Kledo kalau sudah ada di lokal
        const localNames = new Set(localList.map((p) => p.name.toLowerCase().trim()));
        const dedupedKledo = kledoList.filter((p) => !localNames.has(p.name.toLowerCase().trim()));

        let merged = [...localList, ...dedupedKledo];

        // Filter client-side — setiap kata harus ada di nama/SKU
        if (q.trim()) {
          const terms = q.toLowerCase().trim().split(/\s+/);
          const filtered = merged.filter((p) =>
            terms.every(
              (t) => p.name.toLowerCase().includes(t) || (p.sku ?? '').toLowerCase().includes(t),
            ),
          );
          // Kalau filter terlalu ketat dan hasilnya kosong, tampilkan semua hasil API
          merged = filtered.length > 0 ? filtered : merged;
        }

        merged = merged.slice(0, 10);
        setSuggestions(merged);
        setOpen(merged.length > 0);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 300);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange?.(v);
    search(v);
  };

  const handleSelect = (p: ProductOption) => {
    setSuggestions([]);
    setOpen(false);
    onSelect(p);
  };

  const stockColor = (stok: number, source?: string) => {
    if (source === 'kledo') return '#6366F1';
    if (stok > 20) return '#22C55E';
    if (stok > 5) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          className="w-full rounded-lg px-3 py-2 text-sm pr-8"
          style={{ border: `1px solid ${open ? accentColor : '#EDE8F5'}`, color: '#1E1B4B', outline: 'none', background: '#fff' }}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          autoComplete="off"
          onChange={handleChange}
          onFocus={(e) => { e.target.style.borderColor = accentColor; if (value.length >= 2) search(value); }}
          onBlur={(e) => {
            e.target.style.borderColor = '#EDE8F5';
            setTimeout(() => { setSuggestions([]); setOpen(false); }, 200);
          }}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {loading
            ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
            : <Search className="h-3.5 w-3.5 text-gray-300" />}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl overflow-hidden"
          style={{ border: '1px solid #EDE8F5', boxShadow: '0 8px 24px rgba(47,43,61,.14)' }}
        >
          {suggestions.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => handleSelect(p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition"
              style={{ borderBottom: '1px solid #F5F3FF' }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                style={{
                  background: p.source === 'kledo'
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : `${accentColor}18`,
                }}
              >
                <Package className="h-4 w-4" style={{ color: p.source === 'kledo' ? '#fff' : accentColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold truncate" style={{ color: '#1E1B4B' }}>{p.name}</p>
                  {p.source === 'kledo' && (
                    <span
                      className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(99,102,241,.12)', color: '#6366F1' }}
                    >
                      Kledo
                    </span>
                  )}
                </div>
                <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                  SKU: {p.sku || '-'}
                  {p.unit?.name && ` · ${p.unit.name}`}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold" style={{ color: accentColor }}>{fmtRp(p.hargaJual)}</p>
                <p className="text-[10px] font-semibold" style={{ color: stockColor(p.stok, p.source) }}>
                  {p.source === 'kledo' ? 'Dari Kledo' : `Stok: ${p.stok}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
