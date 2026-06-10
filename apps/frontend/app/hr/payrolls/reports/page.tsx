'use client';

export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { PAYROLL_CONFIG, PAYROLL_NAV } from '../../../../lib/nav-configs';
import { BarChart2, Download, RefreshCw } from 'lucide-react';
import { api } from '../../../../lib/api';

const C = PAYROLL_CONFIG.appColor;
const fmtIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function PayrollReportsPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'summary';

  const [periods, setPeriods] = useState<any[]>([]);
  const [periodId, setPeriodId] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/payroll/periods', { params: { limit: 24 } }).then(({ data }) => {
      const list = data.data ?? [];
      setPeriods(list);
      if (list.length > 0) setPeriodId(list[0].id);
    });
  }, []);

  const loadReport = useCallback(async () => {
    if (!periodId) return;
    setLoading(true);
    try {
      if (type === 'bpjs') {
        const { data } = await api.get(`/payroll/reports/bpjs/${periodId}`);
        setReport(data);
      } else if (type === 'pph21') {
        const { data } = await api.get(`/payroll/reports/pph21/${periodId}`);
        setReport(data);
      } else {
        const { data } = await api.get('/payroll/slips', { params: { periodId, limit: 200 } });
        setReport({ rows: data.data ?? [], total: data.total });
      }
    } catch { setReport(null); }
    finally { setLoading(false); }
  }, [periodId, type]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const TABS = [
    { key: 'summary', label: 'Rekap Gaji' },
    { key: 'pph21',   label: 'Laporan PPh21' },
    { key: 'bpjs',    label: 'Laporan BPJS' },
  ];

  return (
    <AppShell {...PAYROLL_CONFIG} navItems={PAYROLL_NAV}>
      <div style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div><h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>Laporan Payroll</h1></div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select value={periodId} onChange={e => setPeriodId(e.target.value)} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '9px 14px' }}>
              {periods.map(p => <option key={p.id} value={p.id}>{MONTHS[p.bulan-1]} {p.tahun}</option>)}
            </select>
            <button onClick={loadReport} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={14} /> Muat
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 0 }}>
          {TABS.map(t => (
            <a key={t.key} href={`?type=${t.key}`} style={{ padding: '10px 20px', fontWeight: 600, fontSize: 14, color: type === t.key ? C : '#666', borderBottom: type === t.key ? `2px solid ${C}` : '2px solid transparent', textDecoration: 'none', marginBottom: -1 }}>{t.label}</a>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>Memuat laporan...</div>
        ) : !report ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>Pilih periode untuk melihat laporan</div>
        ) : type === 'summary' ? (
          <SummaryReport rows={report.rows} />
        ) : type === 'pph21' ? (
          <PPh21Report report={report} />
        ) : (
          <BPJSReport report={report} />
        )}
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Memuat laporan payroll…</div>}>
      <PayrollReportsPageContent />
    </Suspense>
  );
}

function SummaryReport({ rows }: { rows: any[] }) {
  const fmtIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  const totalGross = rows.reduce((s, r) => s + Number(r.gajiPokok) + Number(r.totalTunjangan), 0);
  const totalNet   = rows.reduce((s, r) => s + Number(r.netSalary), 0);
  const totalPph   = rows.reduce((s, r) => s + Number(r.totalPPh21), 0);
  const totalBpjs  = rows.reduce((s, r) => s + Number(r.bpjsKesEmployee) + Number(r.bpjsTKEmployee), 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Karyawan', value: rows.length, prefix: '' },
          { label: 'Total Bruto',    value: totalGross, prefix: 'IDR' },
          { label: 'Total Net',      value: totalNet,   prefix: 'IDR' },
          { label: 'Total PPh21',    value: totalPph,   prefix: 'IDR' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 20 }}>
            <p style={{ color: '#666', fontSize: 13 }}>{s.label}</p>
            <p style={{ fontWeight: 700, fontSize: 20, marginTop: 6 }}>{s.prefix === 'IDR' ? fmtIDR(s.value as number) : s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f8f9ff' }}>
            {['NIK','Nama','Jabatan','Gaji Pokok','Tunjangan','Potongan','BPJS','PPh21','Gaji Bersih'].map(h => (
              <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#444', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '10px 14px', fontSize: 13 }}>{r.employee?.nik}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.employee?.name}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#666' }}>{r.employee?.jabatan || '-'}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13 }}>{fmtIDR(Number(r.gajiPokok))}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, color: '#4CAF50' }}>{fmtIDR(Number(r.totalTunjangan))}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, color: '#f44336' }}>{fmtIDR(Number(r.totalPotongan))}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, color: '#FF9800' }}>{fmtIDR(Number(r.bpjsKesEmployee) + Number(r.bpjsTKEmployee))}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, color: '#9C27B0' }}>{fmtIDR(Number(r.totalPPh21))}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{fmtIDR(Number(r.netSalary))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PPh21Report({ report }: { report: any }) {
  const fmtIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  const rows: any[] = report.rows ?? [];
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#f8f9ff' }}>
          {['NIK','Nama','Status PTKP','Gaji Pokok','PPh21 Bulan Ini','PPh21 YTD'].map(h => (
            <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#444', borderBottom: '1px solid #eee' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map((r: any, i: number) => (
            <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '10px 14px', fontSize: 13 }}>{r.nik}</td>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.nama}</td>
              <td style={{ padding: '10px 14px', fontSize: 13 }}><span style={{ background: 'rgba(103,58,183,.1)', color: '#7B1FA2', padding: '3px 8px', borderRadius: 20, fontSize: 12 }}>{r.ptkpStatus}</span></td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13 }}>{fmtIDR(r.gajiPokok)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#9C27B0' }}>{fmtIDR(r.pph21Bulan)}</td>
              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#666' }}>{fmtIDR(r.pph21YTD)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BPJSReport({ report }: { report: any }) {
  const fmtIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  const rows: any[] = report.rows ?? [];
  const totals = report.totals ?? {};
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 20 }}>
          <p style={{ color: '#666', fontSize: 13 }}>Total BPJS Kesehatan</p>
          <p style={{ fontWeight: 700, fontSize: 18, marginTop: 6 }}>{fmtIDR(totals.bpjsKesEmployee + totals.bpjsKesEmployer)}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 20 }}>
          <p style={{ color: '#666', fontSize: 13 }}>Total BPJS TK</p>
          <p style={{ fontWeight: 700, fontSize: 18, marginTop: 6 }}>{fmtIDR(totals.bpjsTKEmployee + totals.bpjsTKEmployer)}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 20 }}>
          <p style={{ color: '#666', fontSize: 13 }}>Total Tanggungan Perusahaan</p>
          <p style={{ fontWeight: 700, fontSize: 18, marginTop: 6 }}>{fmtIDR(totals.totalEmployer)}</p>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f8f9ff' }}>
            {['NIK','Nama','Gapok','BPJSKes (Kar)','BPJSKes (Per)','BPJSTK (Kar)','BPJSTK (Per)','Total Kar','Total Per'].map(h => (
              <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#444', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '10px 14px', fontSize: 12 }}>{r.nik}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{r.nama}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12 }}>{fmtIDR(r.gapok)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12 }}>{fmtIDR(r.bpjsKesEmployee)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12 }}>{fmtIDR(r.bpjsKesEmployer)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12 }}>{fmtIDR(r.bpjsTKEmployee)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12 }}>{fmtIDR(r.bpjsTKEmployer)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, color: '#f44336', fontWeight: 600 }}>{fmtIDR(r.totalEmployee)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, color: '#FF9800', fontWeight: 600 }}>{fmtIDR(r.totalEmployer)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
