'use client';

export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { PAYROLL_CONFIG, PAYROLL_NAV } from '../../../../lib/nav-configs';
import { Search, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../../../lib/api';

const C = PAYROLL_CONFIG.appColor;
const fmtIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Draft',     color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  APPROVED: { label: 'Disetujui', color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  PAID:     { label: 'Dibayar',   color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
};

function PayrollSlipsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [slips, setSlips] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [periodId, setPeriodId] = useState(searchParams.get('periodId') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);

  const loadPeriods = useCallback(async () => {
    const { data } = await api.get('/payroll/periods', { params: { limit: 24 } });
    setPeriods(data.data ?? []);
  }, []);

  const loadSlips = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (periodId) params.periodId = periodId;
      const { data } = await api.get('/payroll/slips', { params });
      setSlips(data.data ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch { setSlips([]); }
    finally { setLoading(false); }
  }, [periodId, page]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);
  useEffect(() => { loadSlips(); }, [loadSlips]);

  const filtered = slips.filter(s => !search || s.employee?.name?.toLowerCase().includes(search.toLowerCase()) || s.employee?.nik?.includes(search));

  const loadSlipDetail = async (id: string) => {
    const { data } = await api.get(`/payroll/slips/${id}`);
    setSelectedSlip(data);
  };

  return (
    <AppShell {...PAYROLL_CONFIG} navItems={PAYROLL_NAV}>
      <div style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>Slip Gaji</h1>
            <p style={{ color: '#666', marginTop: 4 }}>{total} slip ditemukan</p>
          </div>
          <button onClick={() => router.push('/hr/payrolls/periods')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
            Kelola Periode
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <select value={periodId} onChange={e => { setPeriodId(e.target.value); setPage(1); }} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', minWidth: 200 }}>
            <option value="">Semua Periode</option>
            {periods.map(p => <option key={p.id} value={p.id}>{MONTHS[p.bulan-1]} {p.tahun}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', background: '#fff', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ color: '#999' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari karyawan..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14 }} />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
          {loading ? <div style={{ textAlign: 'center', padding: 60 }}>Memuat...</div> : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9ff' }}>
                    {['NIK','Nama Karyawan','Jabatan','Gaji Pokok','Tunjangan','Potongan','BPJS','PPh21','Gaji Bersih','Status',''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#444', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const st = STATUS_MAP[s.status] ?? STATUS_MAP.DRAFT;
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#666' }}>{s.employee?.nik}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap' }}>{s.employee?.name}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: '#666' }}>{s.employee?.jabatan || '-'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'right' }}>{fmtIDR(Number(s.gajiPokok))}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'right', color: '#4CAF50' }}>{fmtIDR(Number(s.totalTunjangan))}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'right', color: '#f44336' }}>{fmtIDR(Number(s.totalPotongan))}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'right', color: '#FF9800' }}>{fmtIDR(Number(s.bpjsKesEmployee) + Number(s.bpjsTKEmployee))}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'right', color: '#9C27B0' }}>{fmtIDR(Number(s.totalPPh21))}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1a1a2e', textAlign: 'right' }}>{fmtIDR(Number(s.netSalary))}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: st.bg, color: st.color, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => loadSlipDetail(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(103,58,183,.1)', color: C, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                            <Eye size={12} /> Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#999' }}>Tidak ada slip</td></tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #eee' }}>
                <span style={{ fontSize: 13, color: '#666' }}>Halaman {page} dari {totalPages}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer', opacity: page <= 1 ? .4 : 1 }}><ChevronLeft size={14} /></button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer', opacity: page >= totalPages ? .4 : 1 }}><ChevronRight size={14} /></button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Slip Detail Modal */}
        {selectedSlip && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 600, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Slip Gaji</h2>
                  <p style={{ color: '#666', marginTop: 4 }}>{selectedSlip.employee?.name} — {MONTHS[(selectedSlip.period?.bulan ?? 1) - 1]} {selectedSlip.period?.tahun}</p>
                </div>
                <button onClick={() => setSelectedSlip(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, background: '#f8f9ff', borderRadius: 8, padding: 16 }}>
                <div><p style={{ fontSize: 12, color: '#666' }}>NIK</p><p style={{ fontWeight: 600 }}>{selectedSlip.employee?.nik}</p></div>
                <div><p style={{ fontSize: 12, color: '#666' }}>Jabatan</p><p style={{ fontWeight: 600 }}>{selectedSlip.employee?.jabatan || '-'}</p></div>
                <div><p style={{ fontSize: 12, color: '#666' }}>Departemen</p><p style={{ fontWeight: 600 }}>{selectedSlip.employee?.departemen || '-'}</p></div>
                <div><p style={{ fontSize: 12, color: '#666' }}>PTKP</p><p style={{ fontWeight: 600 }}>{selectedSlip.employee?.ptkpStatus}</p></div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f5f5f5' }}><td style={{ padding: '8px 0', color: '#666' }}>Gaji Pokok</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtIDR(Number(selectedSlip.gajiPokok))}</td></tr>
                  <tr style={{ borderBottom: '1px solid #f5f5f5' }}><td style={{ padding: '8px 0', color: '#4CAF50' }}>+ Total Tunjangan</td><td style={{ textAlign: 'right', color: '#4CAF50' }}>{fmtIDR(Number(selectedSlip.totalTunjangan))}</td></tr>
                  <tr style={{ borderBottom: '1px solid #f5f5f5' }}><td style={{ padding: '8px 0', color: '#f44336' }}>- Total Potongan</td><td style={{ textAlign: 'right', color: '#f44336' }}>{fmtIDR(Number(selectedSlip.totalPotongan))}</td></tr>
                  <tr style={{ borderBottom: '1px solid #f5f5f5' }}><td style={{ padding: '8px 0', color: '#FF9800' }}>- BPJS Kesehatan (Karyawan)</td><td style={{ textAlign: 'right', color: '#FF9800' }}>{fmtIDR(Number(selectedSlip.bpjsKesEmployee))}</td></tr>
                  <tr style={{ borderBottom: '1px solid #f5f5f5' }}><td style={{ padding: '8px 0', color: '#FF9800' }}>- BPJS TK (Karyawan)</td><td style={{ textAlign: 'right', color: '#FF9800' }}>{fmtIDR(Number(selectedSlip.bpjsTKEmployee))}</td></tr>
                  <tr style={{ borderBottom: '1px solid #f5f5f5' }}><td style={{ padding: '8px 0', color: '#9C27B0' }}>- PPh 21</td><td style={{ textAlign: 'right', color: '#9C27B0' }}>{fmtIDR(Number(selectedSlip.totalPPh21))}</td></tr>
                  <tr><td style={{ padding: '12px 0', fontWeight: 700, fontSize: 16 }}>Gaji Bersih</td><td style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: C }}>{fmtIDR(Number(selectedSlip.netSalary))}</td></tr>
                </tbody>
              </table>

              {selectedSlip.lines?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Detail Komponen</h3>
                  {selectedSlip.lines.map((l: any) => (
                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                      <span style={{ color: '#444' }}>{l.deskripsi}</span>
                      <span style={{ fontWeight: 600, color: l.amount >= 0 ? '#4CAF50' : '#f44336' }}>{fmtIDR(Math.abs(l.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Memuat slip gaji…</div>}>
      <PayrollSlipsPageContent />
    </Suspense>
  );
}
