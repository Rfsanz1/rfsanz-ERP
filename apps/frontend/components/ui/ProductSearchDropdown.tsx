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
  placeholder = 'Ketik nama atau SKU produk...',
  accentColor = '#00ACC1',
  disabled = false,
}: Props) {
  const [suggestions, setSuggestions] = useState<ProductOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideContainer && !insideDropdown) {
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
    if (!q || q.length < 1) { setSuggestions([]); setOpen(false); return; }
    const seq = ++searchSeqRef.current;
    setLoading(true);
    try {
      const [localRes, kledoRes] = await Promise.allSettled([
        api.get('/inventory/products', { params: { search: q, limit: 30 } }),
        fetch(`/api/direct/kledo-search?type=products&q=${encodeURIComponent(q)}`).then(r => r.json()),
      ]);

      if (seq !== searchSeqRef.current) return;

      const localRaw: any[] =
        localRes.status === 'fulfilled'
          ? (() => { const d = localRes.value.data; return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []; })()
          : [];

      const terms = q.toLowerCase().trim().split(/\s+/);
      const localList: ProductOption[] = localRaw
        .map((p: any) => ({
          id: String(p.id),
          name: p.name ?? '',
          sku: p.sku ?? p.code ?? '',
          hargaJual: Number(p.hargaJual ?? p.price ?? 0),
          stok: Number(p.stok ?? p.stock ?? p.qty ?? 0),
          kledoProductId: p.kledoProductId ?? null,
          unit: p.unit ?? null,
          source: 'local' as const,
        }))
        .filter(p => terms.every(t => p.name.toLowerCase().includes(t) || (p.sku ?? '').toLowerCase().includes(t)));

      const kledoList: ProductOption[] =
        kledoRes.status === 'fulfilled' && kledoRes.value?.success
          ? (kledoRes.value.data ?? []).map((p: any) => ({
              id: p.id,
              name: p.name ?? '',
              sku: p.sku ?? '',
              hargaJual: Number(p.price ?? 0),
              stok: 0,
              kledoProductId: String(p.kledoId ?? ''),
              unit: p.unit ? { name: p.unit } : null,
              source: 'kledo' as const,
            }))
          : [];

      const localNames = new Set(localList.map(p => p.name.toLowerCase().trim()));
      const dedupedKledo = kledoList.filter(p => !localNames.has(p.name.toLowerCase().trim()));
      const merged = [...localList, ...dedupedKledo].slice(0, 20);

      setSuggestions(merged);
      if (merged.length > 0) { updatePos(); setOpen(true); }
      else { setSuggestions([]); setOpen(false); }
    } catch {
      if (seq !== searchSeqRef.current) return;
      setSuggestions([]);
    } finally {
      if (seq === searchSeqRef.current) setLoading(false);
    }
  }, [updatePos]);

  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(q), 300);
  }, [doSearch]);

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

  const ITEM_HEIGHT = 68;
  const MAX_VISIBLE = 3;
  const dropHeight = Math.min(suggestions.length, MAX_VISIBLE) * ITEM_HEIGHT;

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
          onFocus={() => { updatePos(); if (value.length >= 1) search(value); }}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {loading
            ? <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-secondary)' }} />
            : <Search className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {open && suggestions.length > 0 && (
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
            boxShadow: 'var(--shadow-lg)',
            maxHeight: dropHeight + 'px',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch' as any,
            touchAction: 'pan-y',
          }}
        >
          {suggestions.map((p) => (
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
