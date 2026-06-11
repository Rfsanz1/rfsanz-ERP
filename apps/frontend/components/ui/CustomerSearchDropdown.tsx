'use client';

import { useState, useRef, useCallback } from 'react';
import { Search, User, X } from 'lucide-react';
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
  const [selected, setSelected] = useState<CustomerOption | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q || q.length < 2) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [localRes, kledoRes] = await Promise.allSettled([
          api.get('/customers', { params: { search: q, limit: 8, active: 'true' } }),
          api.get('/kledo/contacts', { params: { search: q, per_page: 8 } }),
        ]);

        const localList: CustomerOption[] =
          localRes.status === 'fulfilled'
            ? (localRes.value.data?.data ?? []).map((c: any) => ({ ...c, source: 'local' as const }))
            : [];

        const kledoRaw: any[] =
          kledoRes.status === 'fulfilled'
            ? (kledoRes.value.data?.data ?? [])
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

        const merged = [...localList, ...dedupedKledo].slice(0, 10);
        setSuggestions(merged);
        setOpen(merged.length > 0);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 300);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    setSelected(null);
    search(v);
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

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          className="w-full rounded-lg px-3 py-2 text-sm pr-8"
          style={{ border: `1px solid ${open ? accentColor : '#EDE8F5'}`, color: '#1E1B4B', outline: 'none', background: '#fff' }}
          placeholder={placeholder}
          value={value}
          required={required}
          autoComplete="off"
          onChange={handleChange}
          onFocus={(e) => { e.target.style.borderColor = accentColor; if (value.length >= 2) search(value); }}
          onBlur={(e) => {
            e.target.style.borderColor = '#EDE8F5';
            setTimeout(() => { setSuggestions([]); setOpen(false); }, 200);
          }}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />}
          {selected && !loading && (
            <button type="button" onMouseDown={handleClear} className="p-0.5 rounded hover:bg-gray-100">
              <X className="h-3 w-3 text-gray-400" />
            </button>
          )}
          {!selected && !loading && <Search className="h-3.5 w-3.5 text-gray-300" />}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl overflow-hidden"
          style={{ border: '1px solid #EDE8F5', boxShadow: '0 8px 24px rgba(47,43,61,.14)' }}
        >
          {suggestions.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => handleSelect(c)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 text-white text-xs font-bold"
                style={{ background: c.source === 'kledo'
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : `linear-gradient(135deg, ${accentColor}, ${accentColor}99)` }}
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
              Menampilkan kontak lokal &amp; Kledo · Tidak ada? Ketik nama baru untuk membuat pelanggan baru.
            </p>
          </div>
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
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
              📞 {selected.phone}
            </span>
          )}
          {selected.address && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F5F3FF', color: '#8B5CF6' }}>
              📍 {selected.address}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
