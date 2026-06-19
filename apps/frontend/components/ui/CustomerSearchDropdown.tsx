'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, User, X, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
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

// ── Module-level caches (survive re-renders & re-mounts) ──────────────
let _localContacts: CustomerOption[] = [];
let _localCacheTs = 0;
const LOCAL_TTL = 5 * 60 * 1000;

let _kledoContacts: CustomerOption[] = [];
let _kledoCacheTs = 0;
let _kledoLoading = false;
const KLEDO_TTL = 10 * 60 * 1000;

function textMatch(s: string, q: string) {
  return s.toLowerCase().includes(q.toLowerCase());
}

function filterAndMerge(q: string): CustomerOption[] {
  const t = q.trim();
  const local = t
    ? _localContacts.filter(c => textMatch(c.name, t) || textMatch(c.phone ?? '', t))
    : _localContacts.slice(0, 50);
  const localNames = new Set(local.map(c => c.name.toLowerCase().trim()));
  const kledo = t
    ? _kledoContacts.filter(c =>
        !localNames.has(c.name.toLowerCase().trim()) &&
        (textMatch(c.name, t) || textMatch(c.phone ?? '', t)),
      )
    : _kledoContacts.filter(c => !localNames.has(c.name.toLowerCase().trim())).slice(0, 50);
  return [...local, ...kledo].slice(0, 100);
}

async function loadKledo(): Promise<void> {
  if (_kledoLoading) return;
  if (Date.now() - _kledoCacheTs < KLEDO_TTL && _kledoContacts.length > 0) return;
  _kledoLoading = true;
  try {
    const res = await fetch('/api/direct/kledo-search?type=contacts&q=').then(r => r.json());
    if (res?.success && Array.isArray(res.data)) {
      _kledoContacts = res.data.map((c: any) => ({
        id: c.id,
        name: c.name ?? '',
        phone: c.phone ?? null,
        email: c.email ?? null,
        address: null,
        source: 'kledo' as const,
      }));
      _kledoCacheTs = Date.now();
    }
  } catch { /* ignore */ }
  _kledoLoading = false;
}

async function loadLocal(): Promise<void> {
  if (Date.now() - _localCacheTs < LOCAL_TTL && _localContacts.length > 0) return;
  try {
    const res = await api.get('/customers', { params: { limit: 1000, active: 'true' } });
    const raw: any[] = res.data?.data ?? res.data ?? [];
    _localContacts = raw.map((c: any) => ({
      id: String(c.id),
      name: c.name ?? '',
      phone: c.phone ?? null,
      email: c.email ?? null,
      address: c.address ?? null,
      source: 'local' as const,
    }));
    _localCacheTs = Date.now();
  } catch { /* ignore */ }
}

export default function CustomerSearchDropdown({
  value,
  onChange,
  onSelect,
  placeholder = 'Ketik nama pelanggan...',
  accentColor = '#00ACC1',
  required = false,
}: Props) {
  const [suggestions, setSuggestions] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogueReady, setCatalogueReady] = useState(false);
  const [selected, setSelected] = useState<CustomerOption | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const valueRef = useRef(value);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { openRef.current = open; }, [open]);

  // ── Pre-load on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.allSettled([loadLocal(), loadKledo()]);
      setCatalogueReady(true);
      setLoading(false);
      // If dropdown is already open (user focused quickly), refresh suggestions
      if (openRef.current) {
        setSuggestions(filterAndMerge(valueRef.current));
      }
    };
    load();
  }, []);

  // ── Position dropdown ─────────────────────────────────────────────────
  const updatePos = useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
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

  // ── Outside click ─────────────────────────────────────────────────────
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

  const showSuggestions = useCallback((q: string) => {
    const results = filterAndMerge(q);
    setSuggestions(results);
    setOpen(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    setSelected(null);
    showSuggestions(v);

    // If still loading, reload after done
    if (loading || _kledoLoading) {
      Promise.allSettled([loadLocal(), loadKledo()]).then(() => {
        if (openRef.current) setSuggestions(filterAndMerge(valueRef.current));
      });
    }
  };

  const handleFocus = () => {
    updatePos();
    showSuggestions(value);
    // If catalogue not ready yet, reload and update when done
    if (!catalogueReady || _kledoLoading) {
      Promise.allSettled([loadLocal(), loadKledo()]).then(() => {
        setCatalogueReady(true);
        if (openRef.current) setSuggestions(filterAndMerge(valueRef.current));
      });
    }
  };

  const handleSelect = (c: CustomerOption) => {
    setSelected(c);
    onChange(c.name);
    setSuggestions([]);
    setOpen(false);
    onSelect?.(c);
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
    setSuggestions([]);
    setOpen(false);
  };

  const handleRefresh = async () => {
    if (refreshing || loading) return;
    setRefreshing(true);
    // Reset cache
    _kledoContacts = [];
    _kledoCacheTs = 0;
    _kledoLoading = false;
    try { await fetch('/api/direct/kledo-search', { method: 'DELETE' }); } catch {}
    await Promise.allSettled([loadLocal(), loadKledo()]);
    setSuggestions(filterAndMerge(value));
    setRefreshing(false);
  };

  const kledoReady = _kledoCacheTs > 0;
  const isLoading = loading || refreshing || _kledoLoading;
  const totalContacts = _localContacts.length + _kledoContacts.length;

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
          placeholder={isLoading && !catalogueReady
            ? `Memuat ${totalContacts > 0 ? totalContacts + ' kontak...' : 'kontak Kledo...'}`
            : placeholder}
          value={value}
          required={required}
          autoComplete="off"
          onChange={handleChange}
          onFocus={handleFocus}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isLoading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: accentColor }} />
          )}
          {selected && !isLoading && (
            <button type="button" onMouseDown={handleClear} className="p-0.5 rounded">
              <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
          <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Info baris kontak tersedia */}
      {catalogueReady && totalContacts > 0 && !open && !value && (
        <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {totalContacts} kontak tersedia ({_kledoContacts.length} dari Kledo)
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
            maxHeight: 300,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch' as any,
            touchAction: 'pan-y',
          }}
        >
          {/* Loading state */}
          {isLoading && suggestions.length === 0 && (
            <div className="px-4 py-5 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" style={{ color: accentColor }} />
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Memuat kontak dari Kledo...
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Sekali muat, selanjutnya instan
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  style={{ background: 'transparent', transition: 'background 0.1s', borderBottom: '1px solid var(--border)' }}
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
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {c.name}
                      </p>
                      {c.source === 'kledo' && (
                        <span
                          className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(16,185,129,.12)', color: '#059669' }}
                        >
                          Kledo
                        </span>
                      )}
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

              {suggestions.length >= 100 && (
                <div className="py-1.5 text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Menampilkan 100 kontak · ketik lebih spesifik
                </div>
              )}

              {/* Footer */}
              <div
                className="px-3 py-2 flex items-center justify-between gap-1.5"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <User className="h-3 w-3 inline mr-1" />
                  {kledoReady ? `${_kledoContacts.length} kontak Kledo` : 'Lokal'} · Ketik nama baru → buat otomatis
                </span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  title="Refresh kontak Kledo"
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(16,185,129,.1)',
                    color: '#059669',
                    border: 'none',
                    cursor: refreshing || loading ? 'not-allowed' : 'pointer',
                    opacity: refreshing || loading ? 0.5 : 1,
                  }}
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </>
          )}

          {/* No result */}
          {!isLoading && suggestions.length === 0 && (
            <div className="px-4 py-5 text-center">
              <Search className="h-5 w-5 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {value ? `Tidak ada pelanggan "${value}"` : 'Mulai ketik untuk cari pelanggan'}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {totalContacts > 0
                  ? `${totalContacts} kontak tersedia · coba kata lain`
                  : 'Ketik nama baru → akan dibuat otomatis saat simpan'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected badge */}
      {selected && (
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {selected.source === 'kledo' && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: 'rgba(16,185,129,.12)', color: '#059669' }}
            >
              ✓ Dari Kledo
            </span>
          )}
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
