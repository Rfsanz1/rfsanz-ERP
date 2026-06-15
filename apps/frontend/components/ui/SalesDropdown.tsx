'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Phone, X, User } from 'lucide-react';
import { api } from '../../lib/api';

export interface SalesOption {
  id: string;
  name: string;
  phone?: string | null;
  role?: string;
}

const STATIC_SALES: SalesOption[] = [
  { id: 's1', name: 'Lehan',    phone: '0857-2982-4485', role: 'sales' },
  { id: 's2', name: 'Priyanto', phone: '0823-3479-2357', role: 'sales' },
  { id: 's3', name: 'Agus',     phone: '0857-3084-5708', role: 'sales' },
  { id: 's4', name: 'Dhani',    phone: '0812-1599-2058', role: 'sales' },
  { id: 's5', name: 'Imam',     phone: '0858-9233-3127', role: 'sales' },
  { id: 's6', name: 'Wiwit',    phone: '0857-4115-6110', role: 'sales' },
  { id: 's7', name: 'Agung',    phone: '0882-3368-4224', role: 'sales' },
  { id: 's8', name: 'Rio',      phone: '0859-5282-5277', role: 'sales' },
  { id: 's9', name: 'Andre',    phone: '0821-3763-3912', role: 'sales' },
];

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
  placeholder = 'Pilih nama sales...',
}: Props) {
  const [options, setOptions]   = useState<SalesOption[]>(STATIC_SALES);
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState<SalesOption | null>(null);
  const containerRef            = useRef<HTMLDivElement>(null);

  const loadExtra = useCallback(async () => {
    try {
      const res = await api.get('/users');
      const users: any[] = Array.isArray(res.data) ? res.data : [];
      const backendSales: SalesOption[] = users
        .filter(u => u.active !== false)
        .filter(u => {
          const role = (u.role ?? '').toLowerCase();
          return role === 'sales' || role === 'admin' || role === 'owner' || role === 'super admin';
        })
        .map(u => ({ id: u.id, name: u.name ?? u.email, phone: u.phone ?? u.noHp ?? null, role: u.role }));
      if (backendSales.length > 0) {
        const staticNames = new Set(STATIC_SALES.map(s => s.name.toLowerCase()));
        const extra = backendSales.filter(u => !staticNames.has(u.name.toLowerCase()));
        setOptions([...STATIC_SALES, ...extra]);
      }
    } catch { /* tetap pakai STATIC_SALES */ }
  }, []);

  useEffect(() => { loadExtra(); }, [loadExtra]);

  useEffect(() => {
    if (!value) { setSelected(null); return; }
    const match = options.find(o => o.name.toLowerCase() === value.toLowerCase());
    if (match) setSelected(match);
  }, [value, options]);

  const filtered = query
    ? options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleFocus = () => { setQuery(''); setOpen(true); };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setSelected(null);
    setOpen(true);
  };

  const handleSelect = (s: SalesOption) => {
    setSelected(s);
    setQuery('');
    onChange(s.name);
    setOpen(false);
    onSelect?.(s);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    onChange('');
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const avatarColor = (name: string) => {
    const colors = ['#00ACC1','#6366F1','#F59E0B','#22C55E','#EF4444','#8B5CF6','#06B6D4','#EC4899','#F97316'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const displayText = open && !selected ? query : value;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <User className="h-3.5 w-3.5" style={{ color: open ? accentColor : 'var(--text-muted)' }} />
        </div>
        <input
          className="w-full rounded-xl py-2.5 text-sm"
          style={{
            paddingLeft: '2.2rem',
            paddingRight: selected || value ? '3.5rem' : '2.2rem',
            border: `1.5px solid ${open ? accentColor : 'var(--border)'}`,
            color: 'var(--text-primary)',
            outline: 'none',
            background: 'var(--surface)',
            transition: 'border-color 0.15s',
          }}
          placeholder={open ? 'Ketik untuk cari...' : placeholder}
          value={displayText}
          autoComplete="off"
          onChange={handleInput}
          onFocus={handleFocus}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(selected || value) && (
            <button type="button" onMouseDown={handleClear} className="p-0.5 rounded hover:bg-gray-100">
              <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
          <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
        </div>
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl overflow-hidden"
          style={{
            zIndex: 9999,
            boxShadow: 'var(--shadow-lg)',
            border: '1.5px solid var(--border)',
            background: 'var(--surface)',
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{query}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Tekan Enter atau klik di luar untuk pakai nama ini</p>
            </div>
          ) : (
            filtered.map(s => {
              const color = avatarColor(s.name);
              return (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={() => handleSelect(s)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0 text-white text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}BB)` }}
                  >
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                    {s.phone && (
                      <p className="text-[11px] flex items-center gap-0.5 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        <Phone className="h-2.5 w-2.5" /> {s.phone}
                      </p>
                    )}
                  </div>
                  {s.phone && (
                    <a
                      href={`https://wa.me/62${s.phone.replace(/^0/, '').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      onMouseDown={e => e.stopPropagation()}
                      className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#25D36618', color: '#25D366' }}
                    >
                      WA
                    </a>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {selected?.phone && (
        <p className="mt-1.5 text-[11px] flex items-center gap-1 font-medium" style={{ color: accentColor }}>
          <Phone className="h-3 w-3" /> {selected.phone}
        </p>
      )}
    </div>
  );
}
