'use client';
import { useState } from 'react';
import AppShell from '../../../../components/layout/AppShell';
import { PAYROLL_CONFIG, PAYROLL_NAV } from '../../../../lib/nav-configs';
import { Calculator, RefreshCw } from 'lucide-react';

const C = PAYROLL_CONFIG.appColor;
const fmtIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const PTKP: Record<string, number> = {
  'TK/0': 54_000_000, 'TK/1': 58_500_000, 'TK/2': 63_000_000, 'TK/3': 67_500_000,
  'K/0':  58_500_000, 'K/1':  63_000_000, 'K/2':  67_500_000, 'K/3':  72_000_000,
};

function hitungPPh21Tahunan(pkp: number): number {
  if (pkp <= 0) return 0;
  let pajak = 0;
  const layer: [number, number][] = [[60_000_000, 0.05],[190_000_000, 0.15],[250_000_000, 0.25],[4_500_000_000, 0.30],[Infinity, 0.35]];
  let sisa = pkp;
  for (const [batas, tarif] of layer) {
    if (sisa <= 0) break;
    const kena = Math.min(sisa, batas);
    pajak += kena * tarif;
    sisa -= kena;
  }
  return Math.round(pajak);
}

export default function PPh21CalcPage() {
  const [form, setForm] = useState({ gajiPokok: 5000000, tunjangan: 0, ptkp: 'TK/0' });
  const [result, setResult] = useState<any | null>(null);

  const calculate = () => {
    const gp = Number(form.gajiPokok);
    const tj = Number(form.tunjangan);
    const bruto = gp + tj;
    const biayaJabatan = Math.min(bruto * 0.05, 500_000);
    const jhtEmployee = Math.round(bruto * 0.02);
    const penghasilanNeto = bruto - biayaJabatan - jhtEmployee;
    const ptkpAmount = PTKP[form.ptkp] ?? PTKP['TK/0'];
    const pkpTahunan = Math.max(0, (penghasilanNeto * 12) - ptkpAmount);
    const pph21Tahunan = hitungPPh21Tahunan(pkpTahunan);
    const pph21Bulanan = Math.round(pph21Tahunan / 12);

    const layers: any[] = [];
    const lDef: [number, number, string][] = [[60_000_000, 0.05,'5%'],[190_000_000, 0.15,'15%'],[250_000_000, 0.25,'25%'],[4_500_000_000, 0.30,'30%']];
    let sisa = pkpTahunan;
    for (const [batas, tarif, label] of lDef) {
      if (sisa <= 0) break;
      const kena = Math.min(sisa, batas);
      layers.push({ range: `0 - ${fmtIDR(batas)}`, tarif: label, dasar: kena, pajak: Math.round(kena * tarif) });
      sisa -= kena;
    }

    setResult({ bruto, biayaJabatan, jhtEmployee, penghasilanNeto, ptkpAmount, pkpTahunan, pph21Tahunan, pph21Bulanan, layers });
  };

  return (
    <AppShell {...PAYROLL_CONFIG} navItems={PAYROLL_NAV}>
      <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Kalkulator PPh 21</h1>
        <p style={{ color: '#666', marginBottom: 32 }}>Simulasi hitung PPh 21 bulanan karyawan (UU HPP 2021)</p>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Input Data Karyawan</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Gaji Pokok (Rp)</label>
              <input type="number" value={form.gajiPokok} onChange={e => setForm(f => ({ ...f, gajiPokok: +e.target.value }))} style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Total Tunjangan (Rp)</label>
              <input type="number" value={form.tunjangan} onChange={e => setForm(f => ({ ...f, tunjangan: +e.target.value }))} style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Status PTKP</label>
              <select value={form.ptkp} onChange={e => setForm(f => ({ ...f, ptkp: e.target.value }))} style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', fontSize: 14 }}>
                {Object.entries(PTKP).map(([k, v]) => <option key={k} value={k}>{k} — {fmtIDR(v)}/tahun</option>)}
              </select>
            </div>
          </div>
          <button onClick={calculate} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, background: C, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>
            <Calculator size={16} /> Hitung PPh 21
          </button>
        </div>

        {result && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', padding: 24 }}>
            <h2 style={{ fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Hasil Perhitungan</h2>

            {/* Summary Card */}
            <div style={{ background: `linear-gradient(135deg, ${C}, #ab47bc)`, borderRadius: 12, padding: 24, marginBottom: 20, color: '#fff' }}>
              <p style={{ opacity: .85, fontSize: 14 }}>PPh 21 Bulanan</p>
              <p style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>{fmtIDR(result.pph21Bulanan)}</p>
              <p style={{ opacity: .75, fontSize: 13, marginTop: 4 }}>PPh 21 Tahunan: {fmtIDR(result.pph21Tahunan)}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { label: 'Penghasilan Bruto/bulan', value: result.bruto },
                  { label: 'Biaya Jabatan (5%, max Rp 500rb)', value: -result.biayaJabatan },
                  { label: 'JHT Karyawan (2%)', value: -result.jhtEmployee },
                  { label: 'Penghasilan Neto/bulan', value: result.penghasilanNeto, bold: true },
                  { label: 'Penghasilan Neto Setahun', value: result.penghasilanNeto * 12 },
                  { label: `PTKP (${form.ptkp})`, value: -result.ptkpAmount },
                  { label: 'Penghasilan Kena Pajak (PKP)', value: result.pkpTahunan, bold: true },
                ].map((row) => (
                  <tr key={row.label} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 0', color: '#666', fontSize: 14 }}>{row.label}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: row.bold ? 700 : 400, color: row.value < 0 ? '#f44336' : '#1a1a2e' }}>{row.value < 0 ? `- ${fmtIDR(-row.value)}` : fmtIDR(row.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {result.layers.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Lapisan Tarif Progresif</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f8f9ff' }}>
                    {['Lapisan PKP','Tarif','Dasar Pengenaan','Pajak'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#444', borderBottom: '1px solid #eee' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {result.layers.map((l: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '10px 14px', fontSize: 13 }}>{l.range}</td>
                        <td style={{ padding: '10px 14px' }}><span style={{ background: 'rgba(123,31,162,.1)', color: C, padding: '3px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{l.tarif}</span></td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13 }}>{fmtIDR(l.dasar)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: C }}>{fmtIDR(l.pajak)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
