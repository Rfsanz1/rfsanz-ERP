'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { PAYROLL_CONFIG, PAYROLL_NAV } from '../../../../lib/nav-configs';
import { Search, Settings, Save, X } from 'lucide-react';
import { api } from '../../../../lib/api';

const C = PAYROLL_CONFIG.appColor;

export default function PayrollSettingsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [config, setConfig] = useState<any>({
    bpjsKesEmployee: 1, bpjsKesEmployer: 4,
    bpjsTKJHTEmployee: 2, bpjsTKJHTEmployer: 3.7,
    bpjsTKJKK: 0.24, bpjsTKJKM: 0.3,
  });
  const [ptkp, setPtkp] = useState('TK/0');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get('/hr/employees', { params: { limit: 200 } }).then(({ data }) => setEmployees(data.data ?? []));
  }, []);

  const loadConfig = async (emp: any) => {
    setSelectedEmp(emp);
    setPtkp(emp.ptkpStatus || 'TK/0');
    try {
      const { data } = await api.get(`/payroll/bpjs-config/${emp.id}`);
      if (data) setConfig(data);
    } catch { /* use defaults */ }
  };

  const save = async () => {
    if (!selectedEmp) return;
    setSaving(true);
    try {
      await api.post(`/payroll/bpjs-config/${selectedEmp.id}`, config);
      await api.put(`/hr/employees/${selectedEmp.id}`, { ptkpStatus: ptkp });
      setMsg('Konfigurasi berhasil disimpan');
    } catch { setMsg('Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const filtered = employees.filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.nik?.includes(search));

  const PTKP_OPTIONS = ['TK/0','TK/1','TK/2','TK/3','K/0','K/1','K/2','K/3'];

  return (
    <AppShell {...PAYROLL_CONFIG} navItems={PAYROLL_NAV}>
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Pengaturan Payroll</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Konfigurasi BPJS dan PTKP per karyawan</p>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 24 }}>
          {/* Employee list */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', background: '#fff', marginBottom: 12 }}>
              <Search size={16} style={{ color: '#999' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari karyawan..." style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14 }} />
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', maxHeight: '70vh', overflowY: 'auto' }}>
              {filtered.map(e => (
                <div key={e.id} onClick={() => loadConfig(e)} style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', background: selectedEmp?.id === e.id ? 'rgba(123,31,162,.05)' : '#fff' }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{e.name}</p>
                  <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{e.nik} · {e.jabatan || 'Staff'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Config Panel */}
          <div>
            {!selectedEmp ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#999', background: '#fff', borderRadius: 12, border: '1px solid #eee' }}>
                <Settings size={48} style={{ opacity: .3, marginBottom: 16 }} />
                <p>Pilih karyawan untuk mengatur konfigurasi BPJS & PTKP</p>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 24 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{selectedEmp.name}</h2>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>NIK: {selectedEmp.nik}</p>

                {msg && (
                  <div style={{ marginBottom: 16, background: 'rgba(76,175,80,.1)', border: '1px solid #4CAF50', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#2e7d32', fontSize: 13 }}>{msg}</span>
                    <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
                  </div>
                )}

                {/* PTKP */}
                <div style={{ marginBottom: 24, padding: 16, background: '#f8f9ff', borderRadius: 8 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Status PTKP (PPh21)</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {PTKP_OPTIONS.map(opt => (
                      <button key={opt} onClick={() => setPtkp(opt)} style={{ padding: '8px 16px', borderRadius: 20, border: '2px solid', borderColor: ptkp === opt ? C : '#eee', background: ptkp === opt ? 'rgba(123,31,162,.1)' : '#fff', color: ptkp === opt ? C : '#666', fontWeight: ptkp === opt ? 700 : 400, cursor: 'pointer', fontSize: 13 }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BPJS Config */}
                <div style={{ padding: 16, background: '#f8f9ff', borderRadius: 8, marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Konfigurasi BPJS (%)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                      { key: 'bpjsKesEmployee', label: 'BPJS Kes. (Karyawan)', default: 1 },
                      { key: 'bpjsKesEmployer', label: 'BPJS Kes. (Perusahaan)', default: 4 },
                      { key: 'bpjsTKJHTEmployee', label: 'JHT (Karyawan)', default: 2 },
                      { key: 'bpjsTKJHTEmployer', label: 'JHT (Perusahaan)', default: 3.7 },
                      { key: 'bpjsTKJKK', label: 'JKK (Perusahaan)', default: 0.24 },
                      { key: 'bpjsTKJKM', label: 'JKM (Perusahaan)', default: 0.3 },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>{f.label}</label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                          <input type="number" step="0.01" value={config[f.key] ?? f.default} onChange={e => setConfig((c: any) => ({ ...c, [f.key]: +e.target.value }))} style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 12px', fontSize: 14 }} />
                          <span style={{ padding: '10px 12px', background: '#f0f0f0', color: '#666', fontSize: 13 }}>%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
                  <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
