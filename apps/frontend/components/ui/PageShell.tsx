'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb { label: string; href?: string; }

interface PageShellProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: number | string;
}

export function PageShell({ title, subtitle, breadcrumbs, actions, children, maxWidth = 1400 }: PageShellProps) {
  return (
    <div style={{ maxWidth, width: '100%' }} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 mb-1.5 flex-wrap">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  {b.href ? (
                    <Link href={b.href} style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>
                      {b.label}
                    </Link>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{b.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <ChevronRight size={11} style={{ color: 'var(--text-muted)' }} />}
                </span>
              ))}
            </div>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────────────── */
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  accent?: string;
  loading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ title, value, subtitle, icon: Icon, accent = '#6366F1', loading = false, trend = 'neutral' }: StatCardProps) {
  const light = accent + '1A';
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center justify-between mb-3">
        <div style={{ width: 40, height: 40, borderRadius: 12, background: light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color: accent }} strokeWidth={2} />
        </div>
        {trend !== 'neutral' && (
          <span style={{ fontSize: 11, fontWeight: 600, color: trend === 'up' ? '#10B981' : '#EF4444' }}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="animate-pulse" style={{ height: 24, width: '60%', borderRadius: 6, background: 'var(--border)' }} />
          <div className="animate-pulse" style={{ height: 12, width: '80%', borderRadius: 4, background: 'var(--border)' }} />
        </div>
      ) : (
        <>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>{subtitle}</p>
          )}
        </>
      )}
      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', margin: '6px 0 0' }}>{title}</p>
    </div>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────── */
export function Card({ children, className = '', style = {} }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── CardHeader ───────────────────────────────────────────────────────── */
export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>{title}</p>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ── SearchInput ──────────────────────────────────────────────────────── */
import { Search } from 'lucide-react';

export function SearchInput({
  value, onChange, placeholder = 'Cari...', width = 280
}: { value: string; onChange: (v: string) => void; placeholder?: string; width?: number | string }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border)',
        borderRadius: 10, padding: '0 12px', height: 38,
        width,
      }}
    >
      <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: 'none', background: 'transparent', outline: 'none',
          fontSize: 13, color: 'var(--text-primary)', width: '100%',
        }}
      />
    </div>
  );
}

/* ── Btn ──────────────────────────────────────────────────────────────── */
export function Btn({
  children, onClick, variant = 'primary', size = 'md', icon: Icon, disabled = false, type = 'button',
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  icon?: React.ElementType;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: '#6366F1', color: '#fff', border: '1px solid #6366F1' },
    secondary: { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    danger:    { background: '#EF4444', color: '#fff', border: '1px solid #EF4444' },
    ghost:     { background: 'transparent', color: 'var(--text-secondary)', border: 'none' },
  };
  const pads = { sm: '5px 12px', md: '8px 18px' };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: pads[size], borderRadius: 10,
        fontSize: size === 'sm' ? 12 : 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.5 : 1,
        ...styles[variant],
      }}
    >
      {Icon && <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2} />}
      {children}
    </button>
  );
}

/* ── StatusBadge ──────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<string, { color: string; bg: string; label?: string }> = {
  active:       { color: '#10B981', bg: 'rgba(16,185,129,0.10)',  label: 'Aktif'         },
  inactive:     { color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', label: 'Nonaktif'      },
  confirmed:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  label: 'Dikonfirmasi'  },
  pending:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  label: 'Menunggu'      },
  done:         { color: '#10B981', bg: 'rgba(16,185,129,0.10)',  label: 'Selesai'       },
  cancelled:    { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',   label: 'Dibatalkan'    },
  draft:        { color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', label: 'Draft'         },
  in_progress:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', label: 'Diproses'      },
  paid:         { color: '#10B981', bg: 'rgba(16,185,129,0.10)',  label: 'Lunas'         },
  unpaid:       { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',   label: 'Belum Bayar'   },
  overdue:      { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',   label: 'Jatuh Tempo'   },
  new:          { color: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  label: 'Baru'          },
  won:          { color: '#10B981', bg: 'rgba(16,185,129,0.10)',  label: 'Menang'        },
  lost:         { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',   label: 'Kalah'         },
  open:         { color: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  label: 'Terbuka'       },
  closed:       { color: '#10B981', bg: 'rgba(16,185,129,0.10)',  label: 'Ditutup'       },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const key = status?.toLowerCase().replace(/ /g, '_');
  const s = STATUS_STYLES[key] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,0.10)' };
  const text = label ?? s.label ?? status;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, color: s.color, background: s.bg, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}

/* ── EmptyState ───────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, subtitle, action }: {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      {Icon && (
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon size={24} style={{ color: '#6366F1' }} strokeWidth={1.5} />
        </div>
      )}
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>{title}</p>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>{subtitle}</p>}
      {action}
    </div>
  );
}

/* ── TableRow hover wrapper ────────────────────────────────────────────── */
export function TRow({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'background 0.12s ease', borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--brand-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
    >
      {children}
    </tr>
  );
}
