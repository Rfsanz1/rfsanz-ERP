'use client';

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

function agingLabel(days: number) {
  if (days === 0) return { label: 'Belum Jatuh Tempo', color: '#4CAF50', bg: 'rgba(76,175,80,.1)' };
  if (days <= 30)  return { label: '1–30 hari',         color: '#F57C00', bg: 'rgba(245,124,0,.1)' };
  if (days <= 60)  return { label: '31–60 hari',        color: '#E64A19', bg: 'rgba(230,74,25,.1)' };
  return                  { label: '>60 hari',           color: '#B71C1C', bg: 'rgba(183,28,28,.1)' };
}

interface Row { id: string; ref: string; date: string; dueDate?: string; total: number; outstanding: number; daysOverdue: number; status: string; }
interface Props { receivables: Row[]; payables: Row[]; totalReceivable: number; totalPayable: number; netBalance: number; }

function Table({ rows, type }: { rows: Row[]; type: 'receivable' | 'payable' }) {
  const color = type === 'receivable' ? '#1976D2' : '#E53935';
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#FDFCFF' }}>
            {['No. Ref', 'Tanggal', 'Jatuh Tempo', 'Total', 'Outstanding', 'Aging'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: '#9CA3AF' }}>Tidak ada data</td></tr>
          ) : rows.map((r, i) => {
            const aging = agingLabel(r.daysOverdue);
            return (
              <tr key={r.id} style={{ borderBottom: i < rows.length - 1 ? '1px solid #F5F2FB' : 'none' }}>
                <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color }}>{r.ref}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{fmtDate(r.date)}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{fmtDate(r.dueDate ?? '')}</td>
                <td className="px-4 py-3 text-xs font-medium" style={{ color: '#1E1B4B' }}>{fmtCurrency(r.total)}</td>
                <td className="px-4 py-3 text-xs font-bold" style={{ color }}>{fmtCurrency(r.outstanding)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ color: aging.color, backgroundColor: aging.bg }}>{aging.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ContactStatement({ receivables, payables, totalReceivable, totalPayable, netBalance }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Piutang', value: totalReceivable, color: '#1976D2', bg: 'rgba(25,118,210,.06)' },
          { label: 'Total Hutang',  value: totalPayable,    color: '#E53935', bg: 'rgba(229,57,53,.06)' },
          { label: 'Saldo Bersih',  value: netBalance,      color: netBalance >= 0 ? '#388E3C' : '#E53935', bg: netBalance >= 0 ? 'rgba(56,142,60,.06)' : 'rgba(229,57,53,.06)' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ backgroundColor: s.bg, border: `1.5px solid ${s.color}20` }}>
            <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{fmtCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
          <h4 className="text-sm font-bold" style={{ color: '#1976D2' }}>Piutang (Receivables)</h4>
        </div>
        <Table rows={receivables} type="receivable" />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
          <h4 className="text-sm font-bold" style={{ color: '#E53935' }}>Hutang (Payables)</h4>
        </div>
        <Table rows={payables} type="payable" />
      </div>
    </div>
  );
}
