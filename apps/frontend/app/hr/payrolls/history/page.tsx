'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../../../components/layout/AppShell';
import { PAYROLL_CONFIG, PAYROLL_NAV } from '../../../../lib/nav-configs';
import { Search, Clock } from 'lucide-react';
import { api } from '../../../../lib/api';

const C = PAYROLL_CONFIG.appColor;
const fmtIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Draft',     color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  APPROVED: { label: 'Disetujui', color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  PAID:     { label: 'Dibayar',   color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
};

export default function PayrollHistoryPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [slips, setSlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/hr/employees', { params: { limit: 200 } }).then(({ data }) => setEmployees(data.data ?? []));
  }, []);

  const loadHistory = useCallback(async (emp: any) => {
    setSelectedEmp(emp);
    setLoading(true);
    try {
      const { data } = await api.get('/payroll/slips', { params: { employeeId: emp.id, limit: 50 } });
      setSlips(data.data ?? []);
    } catch { setSlips([]); }
    finally { setLoading(false); }
  }, []);

  const filtered = employees.filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.nik?.includes(search));

  return (
    <AppShell {...PAYROLL_CONFIG} navItems={PAYROLL_NAV}>
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Riwayat Gaji</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Lihat riwayat slip gaji per karyawan</p>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
          {/* Employee list */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', background: '#fff', marginBottom: 12 }}>
              <Search size={16} style={{ color: '#999' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari karyawan..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14 }} />
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', maxHeight: '70vh', overflowY: 'auto' }}>
              {filtered.map(e => (
                <div key={e.id} onClick={() => loadHistory(e)} style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', background: selectedEmp?.id === e.id ? 'rgba(123,31,162,.05)' : '#fff' }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</p>
                  <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{e.nik} · {e.jabatan || 'Staff'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div>
            {!selectedEmp ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#999', background: '#fff', borderRadius: 12, border: '1px solid #eee' }}>
                <Clock size={48} style={{ opacity: .3, marginBottom: 16 }} />
                <p>Pilih karyawan untuk melihat riwayat gaji</p>
              </div>
            ) : loading ? (
              <div style={{ textAlign: 'center', padding: 80 }}>Memuat...</div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'Total Slip', val: slips.length, unit: '' },
                    { label: 'Total Dibayar', val: slips.filter(s => s.status === 'PAID').reduce((sum, s) => sum + Number(s.netSalary), 0), unit: 'IDR' },
                    { label: 'Rata-rata Gaji', val: slips.length > 0 ? slips.reduce((sum, s) => sum + Number(s.netSalary), 0) / slips.length : 0, unit: 'IDR' },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 16 }}>
                      <p style={{ color: '#666', fontSize: 12 }}>{s.label}</p>
                      <p style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>{s.unit === 'IDR' ? fmtIDR(s.val as number) : s.val}</p>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: '#f8f9ff' }}>
                      {['Periode','Gaji Pokok','Tunjangan','Potongan','BPJS','PPh21','Gaji Bersih','Status'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#444', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {slips.map(s => {
                        const st = STATUS_MAP[s.status] ?? STATUS_MAP.DRAFT;
                        return (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{MONTHS[(s.period?.bulan ?? 1) - 1]} {s.period?.tahun}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right' }}>{fmtIDR(Number(s.gajiPokok))}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: '#4CAF50' }}>{fmtIDR(Number(s.totalTunjangan))}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: '#f44336' }}>{fmtIDR(Number(s.totalPotongan))}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: '#FF9800' }}>{fmtIDR(Number(s.bpjsKesEmployee) + Number(s.bpjsTKEmployee))}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: '#9C27B0' }}>{fmtIDR(Number(s.totalPPh21))}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>{fmtIDR(Number(s.netSalary))}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ background: st.bg, color: st.color, padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>{st.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                      {slips.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#999' }}>Belum ada riwayat gaji</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
