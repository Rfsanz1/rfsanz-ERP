'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, User, X, ChevronDown, Loader2, RefreshCw } from 'lucide-react';

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

// Module-level search cache
const _searchCache = new Map<string, CustomerOption[]>();
const _CACHE_TTL_MS = 5 * 60 * 1000;
const _searchCacheTs = new Map<string, number>();

async function searchContacts(q: string): Promise<CustomerOption[]> {
  const key = q.trim().toLowerCase();
  const ts  = _searchCacheTs.get(key) ?? 0;
  if (Date.now() - ts < _CACHE_TTL_MS && _searchCache.has(key)) {
    return _searchCache.get(key)!;
  }

  try {
    const res = await fetch(`/api/direct/kledo-search?type=contacts&q=${encodeURIComponent(q)}`).then(r => r.json());
    if (res?.success && Array.isArray(res.data)) {
      const mapped: CustomerOption[] = res.data.map((c: any) => ({
        id:      String(c.id ?? c.kledoId ?? ''),
        name:    c.name ?? '',
        phone:   c.phone ?? null,
        email:   c.email ?? null,
        address: null,
        source:  'kledo' as const,
      }));
      _searchCache.set(key, mapped);
      _searchCacheTs.set(key, Date.now());
      return mapped;
    }
  } catch { /* ignore */ }
  return [];
}

export default function CustomerSearchDropdown({
  value,
  onChange,
  onSelect,
  placeholder = 'Ketik nama pelanggan...',
  accentColor = '#00ACC1',
  required = false,
}: Props) {
  const [suggestions, setSuggestions]   = useState<CustomerOption[]>([]);
  const [open, setOpen]                 = useState(false);
  const [searching, setSearching]       = useState(false);
  const [selected, setSelected]         = useState<CustomerOption | null>(null);
  const [dropPos, setDropPos]           = useState({ top: 0, inputTop: 0, left: 0, width: 0, openUpward: false });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef       = useRef(0);
  const openRef      = useRef(false);
  const valueRef     = useRef(value);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { openRef.current = open; }, [open]);

  const updatePos = useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUpward = spaceBelow < 320;
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
    const trimmed = q.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(!!trimmed);
      setSearching(false);
      return;
    }

    const seq = ++seqRef.current;
    setSearching(true);
    setOpen(true);

    // Show cached results instantly while re-fetching
    const cached = _searchCache.get(trimmed.toLowerCase());
    if (cached) setSuggestions(cached);

    const results = await searchContacts(trimmed);
    if (seq !== seqRef.current) return; // outdated
    setSuggestions(results);
    setSearching(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    setSelected(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (v.trim().length < 2) {
      setSuggestions([]);
      setOpen(v.trim().length > 0);
      setSearching(false);
      return;
    }

    setSearching(true);
    setOpen(true);
    debounceRef.current = setTimeout(() => doSearch(v), 350);
  };

  const handleFocus = () => {
    updatePos();
    if (value.trim().length >= 2) {
      doSearch(value);
    }
  };

  const handleSelect = (c: CustomerOption) => {
    setSelected(c);
    onChange(c.name);
    setSuggestions([]);
    setOpen(false);
    setSearching(false);
    onSelect?.(c);
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
    setSuggestions([]);
    setOpen(false);
    setSearching(false);
    seqRef.current++;
  };

  const handleRefresh = async () => {
    if (searching) return;
    _searchCache.clear();
    _searchCacheTs.clear();
    if (value.trim().length >= 2) {
      await doSearch(value);
    }
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
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {searching && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: accentColor }} />
          )}
          {selected && !searching && (
            <button type="button" onMouseDown={handleClear} className="p-0.5 rounded">
              <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
          <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Hint when field is empty */}
      {!open && !value && (
        <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Ketik minimal 2 huruf untuk mencari dari Kledo
        </p>
      )}

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
            maxHeight: 300,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch' as any,
            touchAction: 'pan-y',
          }}
        >
          {/* Searching spinner */}
          {searching && suggestions.length === 0 && (
            <div className="px-4 py-5 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" style={{ color: accentColor }} />
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Mencari pelanggan di Kledo...
              </p>
            </div>
          )}

          {/* Results */}
          {suggestions.length > 0 && (
            <>
              {suggestions.slice(0, 80).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  style={{ background: 'transparent', transition: 'background 0.1s', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {c.name}
                      </p>
                      <span
                        className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,.12)', color: '#059669' }}
                      >
                        Kledo
                      </span>
                    </div>
                    {c.phone && (
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                        📞 {c.phone}
                      </p>
                    )}
                    {!c.phone && c.email && (
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                        ✉ {c.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}

              {suggestions.length > 80 && (
                <div className="py-1.5 text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Menampilkan 80 hasil · ketik lebih spesifik
                </div>
              )}

              <div
                className="px-3 py-2 flex items-center justify-between gap-1.5"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <User className="h-3 w-3 inline mr-1" />
                  {suggestions.length} hasil dari Kledo · Ketik nama baru → buat otomatis
                </span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={searching}
                  title="Refresh pencarian"
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(16,185,129,.1)',
                    color: '#059669',
                    border: 'none',
                    cursor: searching ? 'not-allowed' : 'pointer',
                    opacity: searching ? 0.5 : 1,
                  }}
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${searching ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </>
          )}

          {/* No result */}
          {!searching && suggestions.length === 0 && value.trim().length >= 2 && (
            <div className="px-4 py-5 text-center">
              <Search className="h-5 w-5 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Pelanggan &quot;{value}&quot; tidak ditemukan di Kledo
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Ketik nama baru → akan dibuat otomatis saat simpan
              </p>
            </div>
          )}

          {/* Too short */}
          {!searching && value.trim().length < 2 && (
            <div className="px-4 py-4 text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Ketik minimal 2 huruf untuk mencari
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected badge */}
      {selected && (
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          <span
            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'rgba(16,185,129,.12)', color: '#059669' }}
          >
            ✓ Dari Kledo
          </span>
          {selected.phone && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              📞 {selected.phone}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
