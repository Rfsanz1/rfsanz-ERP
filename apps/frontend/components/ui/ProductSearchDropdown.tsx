'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, Package, Loader2, ChevronDown } from 'lucide-react';

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  hargaJual: number;
  hargaBeli: number;
  hargaTertinggi: number;
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

// Module-level search cache (shared across instances)
const _searchCache = new Map<string, ProductOption[]>();
const _searchCacheTs = new Map<string, number>();
const SEARCH_TTL = 5 * 60 * 1000;

async function searchProducts(q: string): Promise<{ results: ProductOption[]; error?: string }> {
  const key = q.trim().toLowerCase();
  const ts  = _searchCacheTs.get(key) ?? 0;
  if (Date.now() - ts < SEARCH_TTL && _searchCache.has(key)) {
    return { results: _searchCache.get(key)! };
  }

  try {
    // q kosong → tetap ambil semua produk dari server (backend handle empty q)
    const url = `/api/direct/kledo-search?type=products&q=${encodeURIComponent(q.trim())}`;
    const res = await fetch(url).then(r => r.json());

    if (!res?.success) {
      return { results: [], error: res?.message ?? 'Pencarian produk gagal' };
    }

    if (Array.isArray(res.data)) {
      const mapped: ProductOption[] = res.data.map((p: any) => {
        const hargaJual      = Number(p.hargaJual ?? 0);
        const hargaBeli      = Number(p.hargaBeli ?? 0);
        const hargaTertinggi = Number(p.hargaTertinggi ?? p.price ?? Math.max(hargaJual, hargaBeli));
        return {
          id:             String(p.id ?? p.kledoId ?? ''),
          name:           p.name ?? '',
          sku:            p.sku ?? '',
          hargaJual,
          hargaBeli,
          hargaTertinggi,
          stok:           Number(p.stok ?? 0),
          kledoProductId: p.kledoId
            ? String(p.kledoId)
            : (p.id?.startsWith?.('kledo-') ? p.id.replace('kledo-', '') : null),
          unit:           p.unit ? { name: String(p.unit) } : null,
          source:         'kledo' as const,
        };
      });
      _searchCache.set(key, mapped);
      _searchCacheTs.set(key, Date.now());
      return { results: mapped };
    }
  } catch (e: any) {
    return { results: [], error: e.message };
  }
  return { results: [] };
}

export default function ProductSearchDropdown({
  value,
  onSelect,
  onChange,
  placeholder = 'Ketik nama atau SKU produk...',
  accentColor = '#00ACC1',
  disabled = false,
}: Props) {
  const [suggestions, setSuggestions] = useState<ProductOption[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [open, setOpen]               = useState(false);
  const [searching, setSearching]     = useState(false);
  const [dropPos, setDropPos]         = useState({ top: 0, inputTop: 0, left: 0, width: 0, openUpward: false });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef       = useRef(0);

  const updatePos = useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUpward = spaceBelow < 360;
    setDropPos({ top: r.bottom + 4, inputTop: r.top, left: r.left, width: r.width, openUpward });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open, updatePos]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (!containerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    const cacheKey = trimmed.toLowerCase();

    const seq = ++seqRef.current;
    setSearching(true);
    setSearchError(null);
    setOpen(true);

    // Tampilkan cache lama sementara fetch berjalan
    const cached = _searchCache.get(cacheKey);
    if (cached && cached.length > 0) setSuggestions(cached);

    const { results, error } = await searchProducts(trimmed);
    if (seq !== seqRef.current) return; // outdated
    setSuggestions(results);
    setSearchError(error ?? null);
    setOpen(true);
    setSearching(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    onChange?.(q);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    setOpen(true);
    debounceRef.current = setTimeout(() => doSearch(q), 350);
  };

  const handleFocus = () => {
    updatePos();
    // Selalu load produk saat focus — kosong = semua produk
    doSearch(value);
  };

  const handleSelect = (p: ProductOption) => {
    setSuggestions([]);
    setOpen(false);
    setSearching(false);
    onSelect(p);
  };

  const ITEM_HEIGHT = 68;
  const MAX_VISIBLE = 5;
  const dropHeight = Math.min(Math.max(suggestions.length, 1), MAX_VISIBLE) * ITEM_HEIGHT;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          className="w-full rounded-xl px-3 py-2.5 text-sm pr-8"
          style={{
            border: `1.5px solid ${open ? accentColor : 'var(--border)'}`,
            color: 'var(--text-primary)',
            outline: 'none',
            background: 'var(--surface)',
            transition: 'border-color .15s',
          }}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          autoComplete="off"
          onChange={handleChange}
          onFocus={handleFocus}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {searching
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: accentColor }} />
            : open
              ? <ChevronDown className="h-3.5 w-3.5" style={{ color: accentColor }} />
              : <Search className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            ...(dropPos.openUpward
              ? { bottom: window.innerHeight - dropPos.inputTop + 4 }
              : { top: dropPos.top }),
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 99999,
            background: 'var(--surface)',
            borderRadius: 14,
            border: '1.5px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,.18)',
            maxHeight: (dropHeight + 40) + 'px',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch' as any,
            touchAction: 'pan-y',
          }}
        >
          {/* Searching spinner */}
          {searching && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentColor }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mencari produk...</p>
            </div>
          )}

          {!searching && suggestions.length === 0 && value.trim().length > 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-2 px-4">
              <Package className="w-8 h-8" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              {searchError ? (
                <p className="text-xs text-center" style={{ color: '#EF4444' }}>
                  ⚠ {searchError}
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Produk &quot;{value}&quot; tidak ditemukan
                </p>
              )}
            </div>
          )}

          {suggestions.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
              style={{ borderBottom: '1px solid var(--border)', minHeight: ITEM_HEIGHT }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0"
                style={{ background: `linear-gradient(135deg,#6366F1,#8B5CF6)` }}
              >
                <Package className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <p className="text-sm font-semibold truncate max-w-full" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <span className="flex-shrink-0 text-[8px] font-bold px-1 py-0.5 rounded-full leading-none"
                    style={{ background: 'rgba(99,102,241,.12)', color: '#6366F1' }}>Kledo</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {p.sku || '-'}{p.unit?.name ? ` · ${p.unit.name}` : ''}
                  </p>
                  {p.hargaJual > 0 && (
                    <span className="text-[11px] font-bold" style={{ color: accentColor }}>
                      Jual: {fmtRp(p.hargaJual)}
                    </span>
                  )}
                  {p.hargaBeli > 0 && (
                    <span className="text-[11px] font-semibold" style={{ color: '#F59E0B' }}>
                      Beli: {fmtRp(p.hargaBeli)}
                    </span>
                  )}
                  {p.hargaJual === 0 && p.hargaBeli === 0 && (
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </div>
              </div>
            </button>
          ))}

          {suggestions.length >= 80 && (
            <div className="py-2 text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Menampilkan 80 hasil pertama · ketik lebih spesifik
            </div>
          )}
        </div>
      )}
    </div>
  );
}
