'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, User, X, ChevronDown, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

export interface CustomerOption {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  source?: 'local' | 'kledo';
}

interface Props {
  value: string;
  onChange: (name: string) => void;
  onSelect?: (customer: CustomerOption) => void;
  placeholder?: string;
  accentColor?: string;
  required?: boolean;
}

// ── Module-level cache (shared across all instances, persists between opens) ──
let _localCache: CustomerOption[] = [];
let _kledoCache: CustomerOption[] = [];
let _localCacheTs = 0;
let _kledoCacheTs = 0;
const LOCAL_TTL = 2 * 60 * 1000;  // 2 menit
const KLEDO_TTL = 10 * 60 * 1000; // 10 menit

function mergeResults(local: CustomerOption[], kledo: CustomerOption[], q: string): CustomerOption[] {
  const filtered = (list: CustomerOption[]) => {
    if (!q) return list;
    const t = q.toLowerCase();
    return list.filter(
      c => (c.name ?? '').toLowerCase().includes(t) || (c.phone ?? '').toLowerCase().includes(t),
    );
  };
  const localFiltered = filtered(local);
  const localNames = new Set(localFiltered.map(c => c.name.toLowerCase().trim()));
  const kledoFiltered = filtered(kledo).filter(c => !localNames.has(c.name.toLowerCase().trim()));
  return [...localFiltered, ...kledoFiltered].slice(0, 20);
}

export default function CustomerSearchDropdown({
  value,
  onChange,
  onSelect,
  placeholder = 'Ketik nama pelanggan atau cari dari Kledo...',
  accentColor = '#00ACC1',
  required = false,
}: Props) {
  const [suggestions, setSuggestions] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [noResult, setNoResult] = useState(false);
  const [selected, setSelected] = useState<CustomerOption | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
    return () => window.removeEventListener('resize', updatePos);
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
    const seq = ++searchSeqRef.current;
    const now = Date.now();

    // ── Show cached data immediately ──
    const cachedMerged = mergeResults(_localCache, _kledoCache, q);
    if (cachedMerged.length > 0) {
      setSuggestions(cachedMerged);
      setNoResult(false);
      setOpen(true);
    }

    const needLocalRefresh = now - _localCacheTs > LOCAL_TTL;
    const needKledoRefresh = now - _kledoCacheTs > KLEDO_TTL;

    if (!needLocalRefresh && !needKledoRefresh) return; // cache fresh, no API call needed

    setRefreshing(true);

    // ── Refresh local cache ──
    if (needLocalRefresh) {
      try {
        const res = await api.get('/customers', { params: { limit: 200, active: 'true' } });
        if (seq !== searchSeqRef.current) return;
        const raw: any[] = res.data?.data ?? res.data ?? [];
        _localCache = raw.map((c: any) => ({
          id: String(c.id),
          name: c.name ?? '',
          phone: c.phone ?? null,
          email: c.email ?? null,
          address: c.address ?? null,
          source: 'local' as const,
        }));
        _localCacheTs = Date.now();
        if (seq === searchSeqRef.current) {
          const merged = mergeResults(_localCache, _kledoCache, q);
          setSuggestions(merged);
          setNoResult(merged.length === 0);
          setOpen(true);
        }
      } catch { /* keep existing cache */ }
    }

    // ── Refresh Kledo cache ──
    if (needKledoRefresh) {
      try {
        const res = await fetch('/api/direct/kledo-search?type=contacts&q=').then(r => r.json());
        if (seq !== searchSeqRef.current) return;
        if (res?.success) {
          _kledoCache = (res.data ?? []).map((c: any) => ({
            id: c.id,
            name: c.name ?? '',
            phone: c.phone ?? null,
            email: c.email ?? null,
            address: null,
            source: 'kledo' as const,
          }));
          _kledoCacheTs = Date.now();
          if (seq === searchSeqRef.current) {
            const merged = mergeResults(_localCache, _kledoCache, q);
            setSuggestions(merged);
            setNoResult(merged.length === 0);
            setOpen(true);
          }
        }
      } catch { /* keep existing cache */ }
    }

    if (seq === searchSeqRef.current) setRefreshing(false);
  }, []);

  const triggerSearch = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Filter from cache instantly, then debounce API refresh
    const instant = mergeResults(_localCache, _kledoCache, q);
    setSuggestions(instant);
    setNoResult(instant.length === 0);
    if (instant.length > 0 || q.length === 0) setOpen(true);
    timerRef.current = setTimeout(() => doSearch(q), 400);
  }, [doSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    setSelected(null);
    triggerSearch(v);
  };

  const handleFocus = () => {
    updatePos();
    doSearch(value);
  };

  const handleSelect = (c: CustomerOption) => {
    setSelected(c);
    onChange(c.name);
    setSuggestions([]);
    setOpen(false);
    setNoResult(false);
    setRefreshing(false);
    onSelect?.(c);
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
    setSuggestions([]);
    setOpen(false);
    setNoResult(false);
    setRefreshing(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          className="w-full rounded-xl px-3 py-2 text-sm pr-16"
          style={{
            border: `1.5px solid ${open ? accentColor : 'var(--border)'}`,
            color: 'var(--text-primary)',
            outline: 'none',
            background: 'var(--surface)',
            transition: 'border-color 0.15s',
          }}
          placeholder={placeholder}
          value={value}
          required={required}
          autoComplete="off"
          onChange={handleChange}
          onFocus={handleFocus}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {refreshing && (
            <div
              className="w-3 h-3 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: accentColor }}
            />
          )}
          {selected && !refreshing && (
            <button type="button" onMouseDown={handleClear} className="p-0.5 rounded">
              <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
          <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

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
            boxShadow: 'var(--shadow-lg)',
            maxHeight: 240,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch' as any,
            touchAction: 'pan-y',
          }}
        >
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 text-white text-xs font-bold"
                    style={{
                      background: c.source === 'kledo'
                        ? 'linear-gradient(135deg,#10B981,#059669)'
                        : `linear-gradient(135deg,${accentColor},${accentColor}99)`,
                    }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                      {c.source === 'kledo' && (
                        <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(16,185,129,.12)', color: '#059669' }}>Kledo</span>
                      )}
                    </div>
                    {c.phone && (
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>📞 {c.phone}</p>
                    )}
                    {!c.phone && c.email && (
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>✉ {c.email}</p>
                    )}
                  </div>
                </button>
              ))}
              <div className="px-3 py-2 flex items-center gap-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                {refreshing && <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#10B981' }} />}
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <User className="h-3 w-3 inline mr-1" />
                  {refreshing ? 'Memperbarui data...' : 'Lokal & Kledo · Ketik nama baru untuk buat pelanggan baru'}
                </p>
              </div>
            </>
          ) : noResult ? (
            <div className="px-4 py-5 text-center">
              <Search className="h-5 w-5 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {value ? `Tidak ada pelanggan "${value}"` : 'Mulai ketik untuk cari pelanggan'}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Ketik nama baru → akan dibuat otomatis saat simpan
              </p>
              {refreshing && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#10B981' }} />
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sedang mencari di Kledo...</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {selected && (
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {selected.source === 'kledo' && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: 'rgba(16,185,129,.12)', color: '#059669' }}>
              ✓ Dari Kledo
            </span>
          )}
          {selected.phone && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
              📞 {selected.phone}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
