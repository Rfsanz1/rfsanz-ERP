export const fmt = (value: number, format: 'currency' | 'number' | 'percent' = 'currency'): string => {
  if (format === 'currency') {
    return `Rp ${value.toLocaleString('id-ID')}`;
  } else if (format === 'percent') {
    return `${value.toFixed(1)}%`;
  } else {
    return value.toLocaleString('id-ID');
  }
};

export const fmtDate = (date: Date | string, includeTime = true): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (includeTime) {
    return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  }
  return d.toLocaleDateString('id-ID', { dateStyle: 'medium' });
};

export const fmtTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('id-ID', { timeStyle: 'short' });
};

export const calculateTax = (subtotal: number, taxRate = 0.11): number => {
  return Math.round(subtotal * taxRate);
};

export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    paid: '#059669',
    pending: '#F59E0B',
    returned: '#EF4444',
    hold: '#8B5CF6',
    active: '#3B82F6',
    closed: '#6B7280',
  };
  return colors[status] || '#64748B';
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    paid: 'Lunas',
    pending: 'Menunggu',
    returned: 'Dikembalikan',
    hold: 'Ditahan',
    active: 'Aktif',
    closed: 'Ditutup',
  };
  return labels[status] || status;
};
