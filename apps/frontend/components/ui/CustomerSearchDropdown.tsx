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

// Per-query result cache so identical searches are instant
const _queryCache = new Map<string, CustomerOption[]>();

function buildKey(q: string) { return q.toLowerCase().trim(); }

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
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [loadingKledo, setLoadingKledo] = useState(false);
  const [selected, setSelected] = useState<CustomerOption | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);

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
      const t = e.target as Node;
      if (!containerRef.current?.contains(t) && !dropdownRef.current?.contains(t))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const doSearch = useCallback(async (q: string) => {
    const seq = ++seqRef.current;
    const key = buildKey(q);

    // Show cached result instantly if available
    const cached = _queryCache.get(key);
    if (cached) {
      setSuggestions(cached);
      setOpen(true);
      setLoadingLocal(false);
      setLoadingKledo(false);
      return;
    }

    setOpen(true);
    setLoadingLocal(true);
    setLoadingKledo(true);

    let localList: CustomerOption[] = [];

    // ── Step 1: local DB (fast ~150ms) ──────────────────────────
    try {
      const res = await api.get('/customers', {
        params: { limit: 100, active: 'true', ...(q ? { search: q } : {}) },
      });
      if (seq !== seqRef.current) return;

      const raw: any[] = res.data?.data ?? res.data ?? [];
      localList = raw
        .filter((c: any) => {
          if (!q) return true;
          const t = q.toLowerCase();
          return (c.name ?? '').toLowerCase().includes(t) ||
                 (c.phone ?? '').toLowerCase().includes(t);
        })
        .map((c: any) => ({
          id: String(c.id),
          name: c.name ?? '',
          phone: c.phone ?? null,
          email: c.email ?? null,
          address: c.address ?? null,
          source: 'local' as const,
        }));

      setSuggestions(localList);
    } catch { /* ignore */ } finally {
      if (seq === seqRef.current) setLoadingLocal(false);
    }

    // ── Step 2: Kledo search with the actual query (server caches) ──
    try {
      const res = await fetch(
        `/api/direct/kledo-search?type=contacts&q=${encodeURIComponent(q)}`,
      ).then(r => r.json());
      if (seq !== seqRef.current) return;

      const kledoList: CustomerOption[] =
        res?.success
          ? (res.data ?? []).map((c: any) => ({
              id: c.id,
              name: c.name ?? '',
              phone: c.phone ?? null,
              email: c.email ?? null,
              address: null,
              source: 'kledo' as const,
            }))
          : [];

      const localNames = new Set(localList.map(c => c.name.toLowerCase().trim()));
      const merged = [
        ...localList,
        ...kledoList.filter(c => !localNames.has(c.name.toLowerCase().trim())),
      ].slice(0, 20);

      setSuggestions(merged);
      _queryCache.set(key, merged); // cache this query result
    } catch { /* ignore */ } finally {
      if (seq === seqRef.current) setLoadingKledo(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    setSelected(null);
    if (timerRef.current) clearTimeout(timerRef.current);

    // Instant cache lookup
    const cached = _queryCache.get(buildKey(v));
    if (cached) {
      setSuggestions(cached);
      setOpen(true);
      return;
    }

    // Show empty state + debounce
    setSuggestions([]);
    timerRef.current = setTimeout(() => doSearch(v), 350);
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
    setLoadingLocal(false);
    setLoadingKledo(false);
    onSelect?.(c);
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
    setSuggestions([]);
    setOpen(false);
    setLoadingLocal(false);
    setLoadingKledo(false);
  };

  const isLoading = loadingLocal || loadingKledo;
  const noResult = !isLoading && suggestions.length === 0 && open;

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
          {isLoading && (
            <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: accentColor }} />
          )}
          {selected && !isLoading && (
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
          {/* Loading state */}
          {isLoading && suggestions.length === 0 && (
            <div className="px-4 py-4 text-center">
              <div className="w-4 h-4 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: 'var(--border)', borderTopColor: accentColor }} />
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Mencari pelanggan...
              </p>
            </div>
          )}

          {/* Results */}
          {suggestions.length > 0 && (
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 text-white text-xs font-bold"
                    style={{
                      background: c.source === 'kledo'
                        ? 'linear-gradient(135deg,#10B981,#059669)'
                        : `linear-gradient(135deg,${accentColor},${accentColor}99)`,
                    }}>
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
                    {c.phone && <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>📞 {c.phone}</p>}
                    {!c.phone && c.email && <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>✉ {c.email}</p>}
                  </div>
                </button>
              ))}

              {/* Footer: loading kledo indicator */}
              <div className="px-3 py-2 flex items-center gap-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                {loadingKledo
                  ? <><Loader2 className="h-3 w-3 animate-spin" style={{ color: '#10B981' }} /><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Memuat dari Kledo...</p></>
                  : <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}><User className="h-3 w-3 inline mr-1" />Lokal &amp; Kledo · Ketik nama baru untuk buat pelanggan baru</p>
                }
              </div>
            </>
          )}

          {/* No result */}
          {noResult && (
            <div className="px-4 py-5 text-center">
              <Search className="h-5 w-5 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {value ? `Tidak ada pelanggan "${value}"` : 'Mulai ketik untuk cari pelanggan'}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Ketik nama baru → akan dibuat otomatis saat simpan
              </p>
            </div>
          )}
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
