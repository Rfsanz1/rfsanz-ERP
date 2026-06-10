'use client';
import { useState } from 'react';
import AppShell from '../../../../components/layout/AppShell';
import { PAYROLL_CONFIG, PAYROLL_NAV } from '../../../../lib/nav-configs';
import { Heart, Calculator } from 'lucide-react';

const C = PAYROLL_CONFIG.appColor;
const fmtIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const DEFAULT_RATES = { kesEmployee: 1, kesEmployer: 4, jhtEmployee: 2, jhtEmployer: 3.7, jkk: 0.24, jkm: 0.3 };

export default function BPJSCalcPage() {
  const [gaji, setGaji] = useState(5000000);
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [result, setResult] = useState<any | null>(null);

  const calculate = () => {
    const g = Number(gaji);
    const bpjsKesEmployee  = Math.round(g * rates.kesEmployee / 100);
    const bpjsKesEmployer  = Math.round(g * rates.kesEmployer / 100);
    const bpjsTKJHTEmployee = Math.round(g * rates.jhtEmployee / 100);
    const bpjsTKJHTEmployer = Math.round(g * rates.jhtEmployer / 100);
    const bpjsJKK          = Math.round(g * rates.jkk / 100);
    const bpjsJKM          = Math.round(g * rates.jkm / 100);
    const totalEmployee    = bpjsKesEmployee + bpjsTKJHTEmployee;
    const totalEmployer    = bpjsKesEmployer + bpjsTKJHTEmployer + bpjsJKK + bpjsJKM;
    const totalBPJS        = totalEmployee + totalEmployer;
    setResult({ bpjsKesEmployee, bpjsKesEmployer, bpjsTKJHTEmployee, bpjsTKJHTEmployer, bpjsJKK, bpjsJKM, totalEmployee, totalEmployer, totalBPJS });
  };

  const setRate = (key: keyof typeof rates, val: number) => setRates(r => ({ ...r, [key]: val }));

  return (
    <AppShell {...PAYROLL_CONFIG} navItems={PAYROLL_NAV}>
      <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Kalkulator BPJS</h1>
        <p style={{ color: '#666', marginBottom: 32 }}>Simulasi iuran BPJS Kesehatan & Ketenagakerjaan</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Input */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', padding: 24 }}>
            <h2 style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Input</h2>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Dasar Pengenaan BPJS (Rp)</label>
              <input type="number" value={gaji} onChange={e => setGaji(+e.target.value)} style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', fontSize: 14 }} />
              <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Maks. untuk BPJS Kes: Rp 12.000.000</p>
            </div>

            <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#555' }}>Tarif Iuran (%)</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { key: 'kesEmployee', label: 'BPJS Kes. (Karyawan)', def: 1 },
                { key: 'kesEmployer', label: 'BPJS Kes. (Perusahaan)', def: 4 },
                { key: 'jhtEmployee', label: 'JHT (Karyawan)', def: 2 },
                { key: 'jhtEmployer', label: 'JHT (Perusahaan)', def: 3.7 },
                { key: 'jkk', label: 'JKK (Perusahaan)', def: 0.24 },
                { key: 'jkm', label: 'JKM (Perusahaan)', def: 0.3 },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <label style={{ fontSize: 13, color: '#555' }}>{f.label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', width: 100 }}>
                    <input type="number" step="0.01" value={(rates as any)[f.key]} onChange={e => setRate(f.key as any, +e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', padding: '8px 10px', fontSize: 13, width: 60 }} />
                    <span style={{ padding: '8px 8px', background: '#f0f0f0', fontSize: 12, color: '#666' }}>%</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={calculate} style={{ marginTop: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>
              <Calculator size={16} /> Hitung BPJS
            </button>
          </div>

          {/* Result */}
          <div>
            {result ? (
              <div>
                <div style={{ background: `linear-gradient(135deg, #E91E63, #9C27B0)`, borderRadius: 16, padding: 24, color: '#fff', marginBottom: 16 }}>
                  <p style={{ opacity: .85 }}>Total Iuran BPJS</p>
                  <p style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{fmtIDR(result.totalBPJS)}/bulan</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 16 }}>
                    <p style={{ fontSize: 12, color: '#666' }}>Ditanggung Karyawan</p>
                    <p style={{ fontWeight: 700, fontSize: 18, color: '#f44336', marginTop: 4 }}>{fmtIDR(result.totalEmployee)}</p>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 16 }}>
                    <p style={{ fontSize: 12, color: '#666' }}>Ditanggung Perusahaan</p>
                    <p style={{ fontWeight: 700, fontSize: 18, color: '#FF9800', marginTop: 4 }}>{fmtIDR(result.totalEmployer)}</p>
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: '#f8f9ff' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#444', borderBottom: '1px solid #eee' }}>Jenis</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#444', borderBottom: '1px solid #eee' }}>Pihak</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#444', borderBottom: '1px solid #eee' }}>Iuran</th>
                    </tr></thead>
                    <tbody>
                      {[
                        ['BPJS Kesehatan', 'Karyawan', result.bpjsKesEmployee],
                        ['BPJS Kesehatan', 'Perusahaan', result.bpjsKesEmployer],
                        ['JHT', 'Karyawan', result.bpjsTKJHTEmployee],
                        ['JHT', 'Perusahaan', result.bpjsTKJHTEmployer],
                        ['JKK', 'Perusahaan', result.bpjsJKK],
                        ['JKM', 'Perusahaan', result.bpjsJKM],
                      ].map(([jenis, pihak, iuran], i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '10px 14px', fontSize: 13 }}>{jenis}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13 }}>
                            <span style={{ background: pihak === 'Karyawan' ? 'rgba(244,67,54,.1)' : 'rgba(255,152,0,.1)', color: pihak === 'Karyawan' ? '#c62828' : '#e65100', padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>{pihak}</span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, fontSize: 13 }}>{fmtIDR(iuran as number)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', padding: 40, textAlign: 'center', color: '#999', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={48} style={{ opacity: .3, marginBottom: 16 }} />
                <p>Klik "Hitung BPJS" untuk melihat hasil</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
