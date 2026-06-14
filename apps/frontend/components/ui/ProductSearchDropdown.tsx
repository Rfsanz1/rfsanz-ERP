'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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

const fmtRp = (v: number) =>
  v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

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

  /* posisi fixed dropdown — ikuti input, tidak ikut scroll */
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePos = useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  /* update posisi saat scroll / resize */
  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  const search = useCallback(async (q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q || q.length < 2) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [localRes, kledoRes] = await Promise.allSettled([
          api.get('/inventory/products', { params: { search: q, limit: 30 } }),
          api.get('/kledo/products', { params: { name: q, per_page: 30 } }),
        ]);

        const localRaw: any[] =
          localRes.status === 'fulfilled'
            ? (() => { const d = localRes.value.data; return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []; })()
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

        const kledoRaw: any[] =
          kledoRes.status === 'fulfilled'
            ? (() => { const d = kledoRes.value.data; const inner = d?.data ?? d; return Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : []; })()
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

        const localNames = new Set(localList.map((p) => p.name.toLowerCase().trim()));
        const dedupedKledo = kledoList.filter((p) => !localNames.has(p.name.toLowerCase().trim()));
        let merged = [...localList, ...dedupedKledo];

        if (q.trim()) {
          const terms = q.toLowerCase().trim().split(/\s+/);
          const filtered = merged.filter((p) =>
            terms.every((t) => p.name.toLowerCase().includes(t) || (p.sku ?? '').toLowerCase().includes(t)),
          );
          merged = filtered.length > 0 ? filtered : merged;
        }

        merged = merged.slice(0, 10);
        setSuggestions(merged);
        if (merged.length > 0) { updatePos(); setOpen(true); }
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 300);
  }, [updatePos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
    search(e.target.value);
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
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          className="w-full rounded-xl px-3 py-2.5 text-sm pr-8"
          style={{
            border: `1.5px solid ${open ? accentColor : '#E5E7EB'}`,
            color: '#1E1B4B',
            outline: 'none',
            background: '#fff',
            transition: 'border-color .15s',
          }}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          autoComplete="off"
          onChange={handleChange}
          onFocus={() => { updatePos(); if (value.length >= 2) search(value); }}
          onBlur={() => setTimeout(() => { setSuggestions([]); setOpen(false); }, 180)}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {loading
            ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
            : <Search className="h-3.5 w-3.5 text-gray-300" />}
        </div>
      </div>

      {/* Dropdown render dengan position:fixed agar tidak ikut scroll */}
      {open && suggestions.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 99999,
            background: '#fff',
            borderRadius: 14,
            border: '1.5px solid #EDE8F5',
            boxShadow: '0 12px 40px rgba(47,43,61,.18)',
            overflow: 'hidden',
          }}
        >
          {suggestions.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => handleSelect(p)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              style={{ borderBottom: '1px solid #F5F3FF' }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
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
                  <p className="text-sm font-semibold truncate" style={{ color: '#1E1B4B' }}>{p.name}</p>
                  {p.source === 'kledo' && (
                    <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(99,102,241,.12)', color: '#6366F1' }}>
                      Kledo
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                  SKU: {p.sku || '-'}{p.unit?.name ? ` · ${p.unit.name}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0 pl-2">
                <p className="text-sm font-bold" style={{ color: accentColor }}>{fmtRp(p.hargaJual)}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: stockColor(p.stok, p.source) }}>
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
