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
const LOCAL_TTL = 5 * 60 * 1000; // 5 min

let _kledoContacts: CustomerOption[] = [];
let _kledoCacheTs = 0;
const KLEDO_TTL = 10 * 60 * 1000; // 10 min

// Track in-flight warm request so only one fires globally
let _warmPromise: Promise<void> | null = null;

async function refreshKledoCache(): Promise<void> {
  _kledoContacts = [];
  _kledoCacheTs = 0;
  _warmPromise = null;
  try { await fetch('/api/direct/kledo-search', { method: 'DELETE' }); } catch {}
  return warmKledo();
}

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

async function warmKledo() {
  if (Date.now() - _kledoCacheTs < KLEDO_TTL) return; // already fresh
  if (_warmPromise) return _warmPromise; // already in-flight
  _warmPromise = fetch('/api/direct/kledo-search?type=contacts&q=')
    .then(r => r.json())
    .then(res => {
      if (res?.success) {
        _kledoContacts = (res.data ?? []).map((c: any) => ({
          id: c.id,
          name: c.name ?? '',
          phone: c.phone ?? null,
          email: c.email ?? null,
          address: null,
          source: 'kledo' as const,
        }));
        _kledoCacheTs = Date.now();
      }
    })
    .catch(() => {})
    .finally(() => { _warmPromise = null; });
  return _warmPromise;
}

async function warmLocal() {
  if (Date.now() - _localCacheTs < LOCAL_TTL) return;
  try {
    const res = await api.get('/customers', { params: { limit: 500, active: 'true' } });
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
  const [warming, setWarming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<CustomerOption | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warmingRef = useRef(false);

  // ── Pre-warm caches on mount ──────────────────────────────────────────
  useEffect(() => {
    const doWarm = async () => {
      if (warmingRef.current) return;
      warmingRef.current = true;
      const needsKledo = Date.now() - _kledoCacheTs >= KLEDO_TTL;
      if (needsKledo) setWarming(true);
      await Promise.all([warmLocal(), warmKledo()]);
      setWarming(false);
    };
    doWarm();
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

  // ── Core search (purely client-side after cache is warm) ─────────────
  const runSearch = useCallback((q: string) => {
    const results = filterAndMerge(q);
    setSuggestions(results);
    setOpen(true);
  }, []);

  // ── If Kledo cache is still loading, wait then re-run search ──────────
  const searchAfterWarm = useCallback(async (q: string) => {
    if (_warmPromise) {
      await _warmPromise;
    }
    runSearch(q);
  }, [runSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    setSelected(null);

    // Show local+cached-kledo results instantly
    runSearch(v);

    // If Kledo cache is still loading, re-run once it's done
    if (_warmPromise) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => searchAfterWarm(v), 100);
    }
  };

  const handleFocus = () => {
    updatePos();
    runSearch(value);
    if (_warmPromise) {
      searchAfterWarm(value);
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

  const handleRefresh = useCallback(async () => {
    if (refreshing || warming) return;
    setRefreshing(true);
    await refreshKledoCache();
    runSearch(value);
    setRefreshing(false);
  }, [refreshing, warming, value, runSearch]);

  const kledoReady = _kledoCacheTs > 0;
  const noResult = !warming && !refreshing && suggestions.length === 0 && open;

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
          {warming && (
            <span title="Memuat kontak Kledo...">
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: accentColor }} />
            </span>
          )}
          {selected && !warming && (
            <button type="button" onMouseDown={handleClear} className="p-0.5 rounded">
              <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
          <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Warm status hint below field */}
      {warming && (
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Memuat kontak dari Kledo... (pertama kali ±10 detik)
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
            boxShadow: 'var(--shadow-lg)',
            maxHeight: 260,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch' as any,
            touchAction: 'pan-y',
          }}
        >
          {/* Loading Kledo */}
          {warming && suggestions.length === 0 && (
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
                  style={{ background: 'transparent', transition: 'background 0.1s' }}
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

              <div
                className="px-3 py-2 flex items-center justify-between gap-1.5"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                {(warming || refreshing)
                  ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" style={{ color: '#10B981' }} /><span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Memuat dari Kledo...</span></span>
                  : <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      <User className="h-3 w-3 inline mr-1" />
                      {kledoReady ? `${_kledoContacts.length} kontak Kledo` : 'Lokal'} · Ketik nama baru → buat otomatis
                    </span>
                }
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing || warming}
                  title="Refresh kontak Kledo"
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(16,185,129,.1)',
                    color: '#059669',
                    border: 'none',
                    cursor: refreshing || warming ? 'not-allowed' : 'pointer',
                    opacity: refreshing || warming ? 0.5 : 1,
                  }}
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
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
