'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, User, Phone, X } from 'lucide-react';
import { api } from '../../lib/api';

export interface SalesOption {
  id: string;
  name: string;
  phone?: string | null;
  role?: string;
}

interface Props {
  value: string;
  onChange: (name: string) => void;
  onSelect?: (sales: SalesOption) => void;
  accentColor?: string;
  placeholder?: string;
}

export default function SalesDropdown({
  value,
  onChange,
  onSelect,
  accentColor = '#00ACC1',
  placeholder = 'Pilih atau ketik nama sales...',
}: Props) {
  const [options, setOptions] = useState<SalesOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SalesOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadSales = useCallback(async () => {
    if (options.length > 0) return;
    setLoading(true);
    try {
      const res = await api.get('/users');
      const users: any[] = res.data ?? [];
      const salesUsers: SalesOption[] = users
        .filter((u) => u.active !== false)
        .filter((u) => {
          const role = (u.role ?? '').toLowerCase();
          return role === 'sales' || role === 'admin' || role === 'owner' || role === 'super admin';
        })
        .map((u) => ({
          id: u.id,
          name: u.name ?? u.email,
          phone: u.phone ?? u.noHp ?? null,
          role: u.role,
        }));
      setOptions(salesUsers);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [options.length]);

  const filtered = options.filter((o) =>
    !value || o.name.toLowerCase().includes(value.toLowerCase()),
  );

  const handleFocus = () => {
    loadSales();
    setOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelected(null);
    setOpen(true);
  };

  const handleSelect = (s: SalesOption) => {
    setSelected(s);
    onChange(s.name);
    setOpen(false);
    onSelect?.(s);
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
    setOpen(false);
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

  const ROLE_COLOR: Record<string, string> = {
    sales: '#0891B2', admin: '#6366F1', owner: '#D97706', 'super admin': '#DC2626',
  };
  const roleColor = (r?: string) => ROLE_COLOR[(r ?? '').toLowerCase()] ?? '#9CA3AF';

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

      {open && (filtered.length > 0 || loading) && (
        <div
          className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl overflow-hidden"
          style={{ zIndex: 9999, boxShadow: '0 8px 32px rgba(47,43,61,.18)', border: '1px solid #EDE8F5' }}
        >
          {loading ? (
            <div className="px-4 py-4 text-center">
              <div className="w-4 h-4 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }} />
            </div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 text-white text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${roleColor(s.role)}, ${roleColor(s.role)}99)` }}
                >
                  {(s.name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold truncate" style={{ color: '#1E1B4B' }}>{s.name}</p>
                    {s.role && (
                      <span
                        className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize"
                        style={{ background: `${roleColor(s.role)}18`, color: roleColor(s.role) }}
                      >
                        {s.role}
                      </span>
                    )}
                  </div>
                  {s.phone && (
                    <p className="text-[11px] flex items-center gap-0.5" style={{ color: '#9CA3AF' }}>
                      <Phone className="h-2.5 w-2.5" /> {s.phone}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}

          {!loading && filtered.length === 0 && value && (
            <div className="px-3 py-2.5">
              <p className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{value}</p>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Ketik manual — tidak ada di daftar</p>
            </div>
          )}

          <div className="px-3 py-2 border-t" style={{ borderColor: '#F5F3FF' }}>
            <p className="text-[10px]" style={{ color: '#C4B5FD' }}>
              <User className="h-3 w-3 inline mr-1" />
              Pilih dari daftar atau ketik nama langsung
            </p>
          </div>
        </div>
      )}

      {selected?.phone && (
        <p className="mt-1 text-[11px] flex items-center gap-1" style={{ color: accentColor }}>
          <Phone className="h-3 w-3" /> {selected.phone}
        </p>
      )}
    </div>
  );
}
