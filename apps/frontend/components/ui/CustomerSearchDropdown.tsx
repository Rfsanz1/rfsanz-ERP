'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, User, X, ChevronDown } from 'lucide-react';
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

export default function CustomerSearchDropdown({
  value,
  onChange,
  onSelect,
  placeholder = 'Cari nama atau nomor HP...',
  accentColor = '#00ACC1',
  required = false,
}: Props) {
  const [suggestions, setSuggestions] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [noResult, setNoResult] = useState(false);
  const [selected, setSelected] = useState<CustomerOption | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    setNoResult(false);
    try {
      const params: any = { limit: 10, active: 'true' };
      if (q && q.length >= 1) params.search = q;

      const [localRes, kledoRes] = await Promise.allSettled([
        api.get('/customers', { params }),
        q && q.length >= 1
          ? api.get('/kledo/contacts', { params: { search: q, per_page: 8, type: 'customer' } })
          : Promise.resolve({ data: { data: [] } }),
      ]);

      const localList: CustomerOption[] =
        localRes.status === 'fulfilled'
          ? (localRes.value.data?.data ?? []).map((c: any) => ({ ...c, source: 'local' as const }))
          : [];

      // Kledo response: { success, data: { data: [...], total, ... }, message }
      const kledoRaw: any[] =
        kledoRes.status === 'fulfilled'
          ? (kledoRes.value.data?.data?.data ?? kledoRes.value.data?.data ?? [])
          : [];

      const kledoList: CustomerOption[] = kledoRaw.map((c: any) => ({
        id: `kledo-${c.id}`,
        name: c.name,
        phone: c.phone ?? null,
        email: c.email ?? null,
        address: null,
        source: 'kledo' as const,
      }));

      const localNames = new Set(localList.map((c) => c.name.toLowerCase().trim()));
      const dedupedKledo = kledoList.filter(
        (c) => !localNames.has(c.name.toLowerCase().trim()),
      );

      let merged = [...localList, ...dedupedKledo];

      // Filter client-side berdasarkan kata yang diketik (fallback jika API tidak filter)
      if (q && q.trim().length >= 1) {
        const terms = q.toLowerCase().trim().split(/\s+/);
        merged = merged.filter((c) =>
          terms.every((t) => c.name.toLowerCase().includes(t)),
        );
      }

      merged = merged.slice(0, 10);
      setSuggestions(merged);
      setNoResult(merged.length === 0);
      setOpen(true);
    } catch {
      setSuggestions([]);
      setNoResult(true);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(q), 280);
  }, [doSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    setSelected(null);
    search(v);
  };

  const handleFocus = () => {
    doSearch(value);
  };

  const handleSelect = (c: CustomerOption) => {
    setSelected(c);
    onChange(c.name);
    setSuggestions([]);
    setOpen(false);
    setNoResult(false);
    onSelect?.(c);
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
    setSuggestions([]);
    setOpen(false);
    setNoResult(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          className="w-full rounded-lg px-3 py-2 text-sm pr-16"
          style={{
            border: `1px solid ${open ? accentColor : '#EDE8F5'}`,
            color: '#1E1B4B',
            outline: 'none',
            background: '#fff',
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
          {loading && (
            <div className="w-3.5 h-3.5 border-2 border-gray-200 rounded-full animate-spin"
              style={{ borderTopColor: accentColor }} />
          )}
          {selected && !loading && (
            <button type="button" onMouseDown={handleClear} className="p-0.5 rounded hover:bg-gray-100">
              <X className="h-3 w-3 text-gray-400" />
            </button>
          )}
          {!loading && (
            <ChevronDown className="h-3.5 w-3.5 text-gray-300" />
          )}
        </div>
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl"
          style={{ zIndex: 9999, boxShadow: '0 8px 32px rgba(47,43,61,.18)', border: '1px solid #EDE8F5', overflow: 'hidden' }}
        >
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => handleSelect(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 text-white text-xs font-bold"
                    style={{
                      background: c.source === 'kledo'
                        ? 'linear-gradient(135deg, #10B981, #059669)'
                        : `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
                    }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate" style={{ color: '#1E1B4B' }}>{c.name}</p>
                      {c.source === 'kledo' && (
                        <span
                          className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(16,185,129,.12)', color: '#059669' }}
                        >
                          Kledo
                        </span>
                      )}
                    </div>
                    {c.phone && <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>📞 {c.phone}</p>}
                    {!c.phone && c.email && <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>✉ {c.email}</p>}
                  </div>
                  {c.address && (
                    <p className="text-[10px] text-right flex-shrink-0 max-w-[100px] truncate" style={{ color: '#C4B5FD' }}>
                      {c.address}
                    </p>
                  )}
                </button>
              ))}
              <div className="px-3 py-2 border-t" style={{ borderColor: '#F5F3FF' }}>
                <p className="text-[10px]" style={{ color: '#C4B5FD' }}>
                  <User className="h-3 w-3 inline mr-1" />
                  Lokal &amp; Kledo · Ketik nama baru untuk buat pelanggan baru
                </p>
              </div>
            </>
          ) : noResult && !loading ? (
            <div className="px-4 py-5 text-center">
              <Search className="h-5 w-5 mx-auto mb-2 text-gray-200" />
              <p className="text-xs font-medium text-gray-400">
                {value ? `Tidak ada pelanggan "${value}"` : 'Tidak ada pelanggan'}
              </p>
              <p className="text-[10px] mt-0.5 text-gray-300">
                Ketik nama baru → akan dibuat otomatis saat simpan
              </p>
            </div>
          ) : (
            <div className="px-4 py-4 text-center">
              <div className="w-4 h-4 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }} />
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
          {selected.address && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#F5F3FF', color: '#8B5CF6' }}>
              📍 {selected.address}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
