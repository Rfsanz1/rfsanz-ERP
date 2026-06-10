'use client';
import { useRouter } from 'next/navigation';
import { Edit2, Eye, MoreVertical } from 'lucide-react';
import { useState } from 'react';

const TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  customer: { label: 'Pelanggan', color: '#1976D2', bg: 'rgba(25,118,210,.1)' },
  supplier: { label: 'Pemasok',   color: '#388E3C', bg: 'rgba(56,142,60,.1)' },
  both:     { label: 'Keduanya',  color: '#7B1FA2', bg: 'rgba(123,31,162,.1)' },
  employee: { label: 'Karyawan',  color: '#F57C00', bg: 'rgba(245,124,0,.1)' },
  other:    { label: 'Lainnya',   color: '#616161', bg: 'rgba(97,97,97,.1)' },
};

function TypeBadge({ types }: { types: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((t) => {
        const cfg = TYPE_BADGE[t] ?? TYPE_BADGE.other;
        return (
          <span key={t} className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}>
            {cfg.label}
          </span>
        );
      })}
    </div>
  );
}

function fmtCurrency(v?: number | null) {
  if (v === undefined || v === null) return '–';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
}

interface Contact {
  id: string; code: string; name: string; type: string[];
  phone?: string; email?: string; termOfPayment?: number;
  isActive: boolean;
}

interface Props {
  data: Contact[];
  loading: boolean;
  total: number;
  page: number;
  onPageChange: (p: number) => void;
}

export default function ContactTable({ data, loading, total, page, onPageChange }: Props) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#FDFCFF' }}>
              {['Kode', 'Nama', 'Tipe', 'Telepon', 'Email', 'Termin', 'Status', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-5 py-14 text-center text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-14 text-center text-sm" style={{ color: '#9CA3AF' }}>Belum ada kontak</td></tr>
            ) : data.map((c, i) => (
              <tr key={c.id}
                className="cursor-pointer transition-colors"
                style={{ borderBottom: i < data.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                onClick={() => router.push(`/contacts/${c.id}`)}>
                <td className="px-5 py-3.5 text-xs font-mono" style={{ color: '#7367F0' }}>{c.code}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: '#7367F0' }}>{c.name?.charAt(0)?.toUpperCase()}</div>
                    <span className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5"><TypeBadge types={c.type} /></td>
                <td className="px-5 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{c.phone || '–'}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{c.email || '–'}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>
                  {c.termOfPayment !== undefined && c.termOfPayment !== null
                    ? c.termOfPayment === 0 ? 'Cash' : `${c.termOfPayment} hari` : '–'}
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ color: c.isActive ? '#4CAF50' : '#9CA3AF', backgroundColor: c.isActive ? 'rgba(76,175,80,.1)' : 'rgba(165,163,174,.12)' }}>
                    {c.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button onClick={() => router.push(`/contacts/${c.id}`)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-purple-50" title="Lihat detail">
                      <Eye className="h-3.5 w-3.5" style={{ color: '#7367F0' }} />
                    </button>
                    <button onClick={() => router.push(`/contacts/${c.id}/edit`)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-purple-50" title="Edit">
                      <Edit2 className="h-3.5 w-3.5" style={{ color: '#7367F0' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #EDE8F5' }}>
        <span className="text-xs" style={{ color: '#9CA3AF' }}>Total: {total} kontak</span>
        <div className="flex gap-2">
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
            className="px-3 py-1 rounded-lg text-xs disabled:opacity-40 transition"
            style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}>← Prev</button>
          <span className="px-3 py-1 text-xs" style={{ color: '#1E1B4B' }}>Hal {page}</span>
          <button onClick={() => onPageChange(page + 1)} disabled={data.length < 20}
            className="px-3 py-1 rounded-lg text-xs disabled:opacity-40 transition"
            style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}>Next →</button>
        </div>
      </div>
    </div>
  );
}
