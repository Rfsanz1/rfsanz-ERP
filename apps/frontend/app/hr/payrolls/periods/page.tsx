'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { PAYROLL_CONFIG, PAYROLL_NAV } from '../../../../lib/nav-configs';
import { Plus, Play, CheckCircle, DollarSign, RefreshCw, Calendar, Users, X } from 'lucide-react';
import { api } from '../../../../lib/api';

const C = PAYROLL_CONFIG.appColor;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:      { label: 'Draft',      color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  CALCULATED: { label: 'Dihitung',   color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  APPROVED:   { label: 'Disetujui',  color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  PAID:       { label: 'Dibayar',    color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
};

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

interface Period { id: string; bulan: number; tahun: number; status: string; note?: string; _count?: { slips: number } }

export default function PayrollPeriodsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear(), note: '' });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/payroll/periods', { params: { limit: 24 } });
      setPeriods(data.data ?? []);
    } catch { setPeriods([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createPeriod = async () => {
    try {
      await api.post('/payroll/periods', form);
      setMsg({ type: 'success', text: 'Periode berhasil dibuat' });
      setShowForm(false);
      load();
    } catch (e: any) { setMsg({ type: 'error', text: e?.response?.data?.message || 'Gagal membuat periode' }); }
  };

  const doAction = async (id: string, action: 'calculate' | 'approve' | 'process') => {
    const labels: Record<string, string> = { calculate: 'Menghitung...', approve: 'Menyetujui...', process: 'Memproses...' };
    setActionLoading(id + action);
    try {
      await api.post(`/payroll/periods/${id}/${action}`);
      setMsg({ type: 'success', text: `Berhasil: ${action}` });
      load();
    } catch (e: any) { setMsg({ type: 'error', text: e?.response?.data?.message || `Gagal ${action}` }); }
    finally { setActionLoading(null); }
  };

  const s = (n: number) => String(n).padStart(2, '0');

  return (
    <AppShell {...PAYROLL_CONFIG} navItems={PAYROLL_NAV}>
      <div style={{ padding: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>Periode Penggajian</h1>
            <p style={{ color: '#666', marginTop: 4 }}>Kelola siklus payroll bulanan</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={16} /> Buat Periode
          </button>
        </div>

        {/* Alert */}
        {msg && (
          <div style={{ marginBottom: 16, background: msg.type === 'success' ? 'rgba(76,175,80,.1)' : 'rgba(244,67,54,.1)', border: `1px solid ${msg.type === 'success' ? '#4CAF50' : '#f44336'}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: msg.type === 'success' ? '#2e7d32' : '#c62828' }}>{msg.text}</span>
            <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw' }}>
              <h2 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Buat Periode Baru</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6, display: 'block' }}>Bulan</label>
                  <select value={form.bulan} onChange={e => setForm(f => ({ ...f, bulan: +e.target.value }))} style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px' }}>
                    {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{i+1} - {m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6, display: 'block' }}>Tahun</label>
                  <input type="number" value={form.tahun} onChange={e => setForm(f => ({ ...f, tahun: +e.target.value }))} style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px' }} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6, display: 'block' }}>Catatan</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Opsional..." style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Batal</button>
                <button onClick={createPeriod} style={{ padding: '10px 20px', background: C, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Buat</button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#666' }}>Memuat...</div>
        ) : periods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#666' }}>
            <Calendar size={48} style={{ opacity: .3, marginBottom: 16 }} />
            <p>Belum ada periode penggajian</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9ff' }}>
                  {['Periode','Status','Jumlah Karyawan','Catatan','Aksi'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#444', borderBottom: '1px solid #eee' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map(p => {
                  const st = STATUS_MAP[p.status] ?? STATUS_MAP.DRAFT;
                  const isLoading = (act: string) => actionLoading === p.id + act;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1a1a2e' }}>
                        {MONTHS[p.bulan - 1]} {p.tahun}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#444' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={14} style={{ color: '#999' }} />
                          {p._count?.slips ?? 0} slip
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#888', fontSize: 13 }}>{p.note || '-'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {p.status === 'DRAFT' && (
                            <button onClick={() => doAction(p.id, 'calculate')} disabled={!!isLoading('calculate')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FF9800', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              {isLoading('calculate') ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />} Hitung
                            </button>
                          )}
                          {p.status === 'CALCULATED' && (
                            <button onClick={() => doAction(p.id, 'approve')} disabled={!!isLoading('approve')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2196F3', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              {isLoading('approve') ? <RefreshCw size={12} /> : <CheckCircle size={12} />} Approve
                            </button>
                          )}
                          {p.status === 'APPROVED' && (
                            <button onClick={() => doAction(p.id, 'process')} disabled={!!isLoading('process')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              {isLoading('process') ? <RefreshCw size={12} /> : <DollarSign size={12} />} Proses Pembayaran
                            </button>
                          )}
                          <button onClick={() => router.push(`/hr/payrolls/slips?periodId=${p.id}`)} style={{ background: 'rgba(103,58,183,.1)', color: C, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Lihat Slip</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
