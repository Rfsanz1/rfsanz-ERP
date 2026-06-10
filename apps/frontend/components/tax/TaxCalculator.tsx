'use client';

import { useState } from 'react';
import { Calculator, ChevronDown } from 'lucide-react';

type TaxMode = 'PPN' | 'PPH21' | 'PPH23' | 'PPH4A2';

const PTKP_OPTIONS = [
  'TK/0','TK/1','TK/2','TK/3',
  'K/0','K/1','K/2','K/3',
  'K/I/0','K/I/1','K/I/2','K/I/3',
];

const PPH23_JENIS = ['jasa','dividen','bunga','royalti','sewa','hadiah','imbalan'];
const PPH4A2_JENIS = [
  'sewa_tanah_bangunan','konstruksi_sederhana','konstruksi_menengah',
  'konstruksi_besar','jasa_konstruksi_sederhana','jasa_konstruksi_besar',
  'pengalihan_tanah','bunga_koperasi',
];

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID').format(Math.round(n));
}

interface TaxCalculatorProps {
  defaultMode?: TaxMode;
  onResult?: (result: Record<string, number>) => void;
}

export default function TaxCalculator({ defaultMode = 'PPN', onResult }: TaxCalculatorProps) {
  const [mode, setMode] = useState<TaxMode>(defaultMode);
  const [amount, setAmount] = useState('');
  const [ppnRate, setPpnRate] = useState('11');
  const [statusPajak, setStatusPajak] = useState('TK/0');
  const [jenisPPh23, setJenisPPh23] = useState('jasa');
  const [jenisPPh4a2, setJenisPPh4a2] = useState('sewa_tanah_bangunan');
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  async function calculate() {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    try {
      let url = `${apiBase}/tax/calculate/`;
      let body: Record<string, any> = {};

      if (mode === 'PPN') {
        url += 'ppn';
        body = { amount: Number(amount), taxRate: Number(ppnRate) };
      } else if (mode === 'PPH21') {
        url += 'pph21';
        body = { grossSalary: Number(amount), statusPajak };
      } else if (mode === 'PPH23') {
        url += 'pph23';
        body = { amount: Number(amount), jenis: jenisPPh23 };
      } else {
        url += 'pph4a2';
        body = { amount: Number(amount), jenis: jenisPPh4a2 };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
      onResult?.(data);
    } catch {
      setResult({ error: 'Gagal menghitung. Pastikan server berjalan.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border-b border-blue-100">
        <Calculator className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">Kalkulator Pajak Indonesia</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex gap-1 flex-wrap">
          {(['PPN','PPH21','PPH23','PPH4A2'] as TaxMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                mode === m
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m === 'PPH4A2' ? 'PPh 4(2)' : m === 'PPH21' ? 'PPh 21' : m === 'PPH23' ? 'PPh 23' : 'PPN'}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            {mode === 'PPH21' ? 'Gaji Bruto / Bulan (Rp)' : 'Jumlah (Rp)'}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {mode === 'PPN' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tarif PPN (%)</label>
            <div className="flex gap-2">
              {['11','12'].map((r) => (
                <button key={r} onClick={() => setPpnRate(r)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border transition-all ${ppnRate === r ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {r}%
                </button>
              ))}
              <input
                type="number" value={ppnRate} onChange={(e) => setPpnRate(e.target.value)}
                className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                placeholder="custom"
              />
            </div>
          </div>
        )}

        {mode === 'PPH21' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status PTKP</label>
            <div className="relative">
              <select value={statusPajak} onChange={(e) => setStatusPajak(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PTKP_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {mode === 'PPH23' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Jenis Penghasilan</label>
            <div className="relative">
              <select value={jenisPPh23} onChange={(e) => setJenisPPh23(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PPH23_JENIS.map((j) => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {mode === 'PPH4A2' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Jenis Objek PPh 4(2)</label>
            <div className="relative">
              <select value={jenisPPh4a2} onChange={(e) => setJenisPPh4a2(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PPH4A2_JENIS.map((j) => <option key={j} value={j}>{j.replace(/_/g,' ')}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        <button onClick={calculate} disabled={loading || !amount}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors">
          {loading ? 'Menghitung...' : 'Hitung Pajak'}
        </button>

        {result && !result.error && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs space-y-1.5">
            {mode === 'PPN' && (
              <>
                <Row label="DPP" value={`Rp ${fmt(result.dpp)}`} />
                <Row label={`PPN ${result.rate}%`} value={`Rp ${fmt(result.ppn)}`} highlight />
                <Row label="Total" value={`Rp ${fmt(result.total)}`} bold />
              </>
            )}
            {mode === 'PPH21' && (
              <>
                <Row label="Gaji Bruto/Bulan" value={`Rp ${fmt(result.grossSalary)}`} />
                <Row label="PTKP" value={`Rp ${fmt(result.ptkp)}`} />
                <Row label="PKP Setahun" value={`Rp ${fmt(result.pkp)}`} />
                <div className="border-t border-gray-200 pt-1.5">
                  {result.rincianTarif?.map((r: any, i: number) => (
                    <div key={i} className="flex justify-between text-gray-500">
                      <span>{r.lapisan} ({r.rate}%)</span>
                      <span>Rp {fmt(r.jumlah)}</span>
                    </div>
                  ))}
                </div>
                <Row label="PPh 21 Setahun" value={`Rp ${fmt(result.pph21Setahun)}`} highlight />
                <Row label="PPh 21 / Bulan" value={`Rp ${fmt(result.pph21Bulanan)}`} bold />
              </>
            )}
            {mode === 'PPH23' && (
              <>
                <Row label="Bruto" value={`Rp ${fmt(result.bruto)}`} />
                <Row label={`Tarif (${result.rate}%)`} value="" />
                <Row label="PPh 23" value={`Rp ${fmt(result.pph23)}`} highlight bold />
                <Row label="DPP (setelah potong)" value={`Rp ${fmt(result.bruto - result.pph23)}`} />
              </>
            )}
            {mode === 'PPH4A2' && (
              <>
                <Row label="Bruto" value={`Rp ${fmt(result.bruto)}`} />
                <Row label={`Tarif (${result.rate}%)`} value="" />
                <Row label="PPh 4(2)" value={`Rp ${fmt(result.pph4a2)}`} highlight bold />
              </>
            )}
          </div>
        )}
        {result?.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{result.error}</div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight, bold }: { label: string; value: string; highlight?: boolean; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${highlight ? 'text-blue-700' : 'text-gray-700'} ${bold ? 'font-bold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
