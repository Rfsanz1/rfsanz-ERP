export function formatRp(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} rb`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function formatCurrency(value: number, currency = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', opts ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function formatDatetime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function extractName(val: unknown): string {
  if (!val) return '–';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    return String(obj.name ?? obj.nama ?? obj.email ?? '–');
  }
  return String(val);
}

export function truncate(str: string, len = 30): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}
