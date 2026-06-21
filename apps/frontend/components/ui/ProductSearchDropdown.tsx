'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, Package, Loader2, ChevronDown } from 'lucide-react';
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

// ── Module-level product cache (shared across all instances) ──
let _allLocalProducts: ProductOption[] = [];
let _allKledoProducts: ProductOption[] = [];
let _localCacheTs = 0;
let _kledoCacheTs = 0;
let _kledoLoading = false;
const LOCAL_TTL = 2 * 60 * 1000;
const KLEDO_TTL = 10 * 60 * 1000;

const _queryCache = new Map<string, ProductOption[]>();

function filterProducts(local: ProductOption[], kledo: ProductOption[], q: string): ProductOption[] {
  const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const match = (p: ProductOption) =>
    terms.length === 0 ||
    terms.every(t => p.name.toLowerCase().includes(t) || (p.sku ?? '').toLowerCase().includes(t));
  const localFiltered = local.filter(match);
  const localNames = new Set(localFiltered.map(p => p.name.toLowerCase().trim()));
  const kledoFiltered = kledo.filter(p => match(p) && !localNames.has(p.name.toLowerCase().trim()));
  // show more results — 100 max
  return [...localFiltered, ...kledoFiltered].slice(0, 100);
}

// Pre-load Kledo catalogue globally (called once on first mount)
async function preloadKledo() {
  if (_kledoLoading) return;
  if (Date.now() - _kledoCacheTs < KLEDO_TTL && _allKledoProducts.length > 0) return;
  _kledoLoading = true;
  try {
    const res = await fetch('/api/direct/kledo-search?type=products&q=').then(r => r.json());
    if (res?.success && Array.isArray(res.data)) {
      _allKledoProducts = res.data.map((p: any) => {
        const hargaJual = Number(p.hargaJual ?? 0);
        const hargaBeli = Number(p.hargaBeli ?? 0);
        const hpp       = Number(p.hpp       ?? 0);
        const hargaTertinggi = Math.max(hargaJual, hargaBeli, hpp, Number(p.price ?? 0));
        return {
          id: p.id,
          name: p.name ?? '',
          sku: p.sku ?? '',
          hargaJual: hargaTertinggi,
          stok: 0,
          kledoProductId: String(p.kledoId ?? ''),
          unit: p.unit ? { name: p.unit } : null,
          source: 'kledo' as const,
        };
      });
      _kledoCacheTs = Date.now();
      _queryCache.clear();
      // Patch harga lokal yang masih 0 menggunakan data Kledo
      patchLocalPricesFromKledo();
    }
  } catch { /* ignore */ }
  _kledoLoading = false;
}

async function preloadLocal() {
  if (Date.now() - _localCacheTs < LOCAL_TTL && _allLocalProducts.length > 0) return;
  try {
    const res = await api.get('/inventory/products', { params: { limit: 1000 } });
    const d = res.data;
    const raw: any[] = Array.isArray(d)
      ? d
      : Array.isArray(d?.data?.data)
        ? d.data.data
        : Array.isArray(d?.data)
          ? d.data
          : [];
    _allLocalProducts = raw.map((p: any) => {
      const hargaJual = Number(p.hargaJual ?? p.sellPrice ?? p.price ?? 0);
      const hargaBeli = Number(p.hargaBeli ?? p.buyPrice ?? 0);
      // Tampilkan harga tertinggi yang tersedia (jual atau beli)
      const hargaTertinggi = Math.max(hargaJual, hargaBeli);
      return {
        id: String(p.id),
        name: p.name ?? '',
        sku: p.sku ?? p.code ?? '',
        hargaJual: hargaTertinggi,
        stok: Number(p.stok ?? p.stock ?? p.qty ?? 0),
        kledoProductId: p.kledoProductId ?? null,
        unit: p.unit ?? null,
        source: 'local' as const,
        _rawHargaJual: hargaJual, // simpan asli untuk patch Kledo
      };
    });
    _localCacheTs = Date.now();
    _queryCache.clear();
  } catch { /* ignore */ }
}

/** Setelah Kledo selesai load, patch harga lokal yang masih 0 dari data Kledo */
function patchLocalPricesFromKledo() {
  if (_allKledoProducts.length === 0 || _allLocalProducts.length === 0) return;

  const kledoById = new Map<string, ProductOption>();
  const kledoByName = new Map<string, ProductOption>();
  for (const k of _allKledoProducts) {
    if (k.kledoProductId) kledoById.set(k.kledoProductId, k);
    kledoByName.set(k.name.toLowerCase().trim(), k);
  }

  let changed = false;
  _allLocalProducts = _allLocalProducts.map(p => {
    if (p.hargaJual > 0) return p; // sudah ada harga, skip
    const match = (p.kledoProductId ? kledoById.get(p.kledoProductId) : null)
      ?? kledoByName.get(p.name.toLowerCase().trim());
    if (match && match.hargaJual > 0) { changed = true; return { ...p, hargaJual: match.hargaJual }; }
    return p;
  });
  if (changed) _queryCache.clear();
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogueReady, setCatalogueReady] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeqRef = useRef(0);

  const updatePos = useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  // ── Pre-load catalogue on mount ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.allSettled([preloadLocal(), preloadKledo()]);
      setCatalogueReady(true);
      setLoading(false);
    };
    load();
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

  const showSuggestions = useCallback((q: string) => {
    const results = filterProducts(_allLocalProducts, _allKledoProducts, q);
    setSuggestions(results);
    if (results.length > 0) setOpen(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    onChange?.(q);

    // Instant filter from catalogue cache
    showSuggestions(q);

    // Debounce re-fetch if cache is stale
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const seq = ++searchSeqRef.current;
      const needLocalRefresh = Date.now() - _localCacheTs > LOCAL_TTL;
      const needKledoRefresh = Date.now() - _kledoCacheTs > KLEDO_TTL;
      if (!needLocalRefresh && !needKledoRefresh) return;
      setLoading(true);
      if (needLocalRefresh) await preloadLocal();
      if (needKledoRefresh) await preloadKledo();
      if (seq === searchSeqRef.current) {
        showSuggestions(q);
        setLoading(false);
      }
    }, 500);
  };

  const handleFocus = () => {
    updatePos();
    // Show all products (filtered by current value) on focus
    showSuggestions(value);
    // If catalogue is not ready, start loading
    if (!catalogueReady && !loading) {
      setLoading(true);
      Promise.allSettled([preloadLocal(), preloadKledo()]).then(() => {
        setCatalogueReady(true);
        setLoading(false);
        showSuggestions(value);
      });
    }
  };

  const handleSelect = (p: ProductOption) => {
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
    onSelect(p);
  };

  const stockColor = (stok: number, source?: string) => {
    if (source === 'kledo') return '#6366F1';
    if (stok > 20) return '#22C55E';
    if (stok > 5) return '#F59E0B';
    return '#EF4444';
  };

  const totalInCatalogue = _allLocalProducts.length + _allKledoProducts.length;

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
          placeholder={loading ? `Memuat ${totalInCatalogue > 0 ? totalInCatalogue + ' produk...' : 'katalog Kledo...'}` : placeholder}
          value={value}
          disabled={disabled}
          autoComplete="off"
          onChange={handleChange}
          onFocus={handleFocus}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: accentColor }} />
            : open
              ? <ChevronDown className="h-3.5 w-3.5" style={{ color: accentColor }} />
              : <Search className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {/* Catalogue info bar */}
      {catalogueReady && totalInCatalogue > 0 && !open && !value && (
        <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {totalInCatalogue} produk tersedia ({_allKledoProducts.length} dari Kledo)
        </p>
      )}

      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 99999,
            background: 'var(--surface)',
            borderRadius: 14,
            border: '1.5px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,.18)',
            maxHeight: dropHeight + 'px',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch' as any,
            touchAction: 'pan-y',
          }}
        >
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Package className="w-8 h-8" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Produk &quot;{value}&quot; tidak ditemukan
              </p>
              {totalInCatalogue > 0 && (
                <p className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                  Coba kata lain · {totalInCatalogue} produk tersedia
                </p>
              )}
            </div>
          ) : (
            suggestions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ borderBottom: '1px solid var(--border)', minHeight: ITEM_HEIGHT }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: p.source === 'kledo' ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : `${accentColor}18` }}
                >
                  <Package className="h-4 w-4" style={{ color: p.source === 'kledo' ? '#fff' : accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    {p.source === 'kledo' && (
                      <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(99,102,241,.12)', color: '#6366F1' }}>Kledo</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    SKU: {p.sku || '-'}{p.unit?.name ? ` · ${p.unit.name}` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 pl-2">
                  <p className="text-sm font-bold" style={{ color: p.hargaJual > 0 ? accentColor : 'var(--text-muted)' }}>
                    {p.hargaJual > 0 ? fmtRp(p.hargaJual) : 'Harga belum diset'}
                  </p>
                  {p.source === 'kledo' && (
                    <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#6366F1' }}>Dari Kledo</p>
                  )}
                </div>
              </button>
            ))
          )}
          {suggestions.length === 100 && (
            <div className="py-2 text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Menampilkan 100 produk pertama · ketik lebih spesifik untuk mempersempit
            </div>
          )}
        </div>
      )}
    </div>
  );
}
