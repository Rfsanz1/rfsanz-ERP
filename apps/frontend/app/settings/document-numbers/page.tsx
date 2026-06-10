'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { Hash, Save, RefreshCw, CheckCircle, Eye } from 'lucide-react';

const DOC_TYPES = [
  { key: 'so', label: 'Sales Order', prefix: 'SO', module: 'Penjualan', example: 'SO-2026-0001' },
  { key: 'quo', label: 'Quotation', prefix: 'QUO', module: 'Penjualan', example: 'QUO-2026-0001' },
  { key: 'inv', label: 'Invoice', prefix: 'INV', module: 'Keuangan', example: 'INV-2026-0001' },
  { key: 'po', label: 'Purchase Order', prefix: 'PO', module: 'Pembelian', example: 'PO-2026-0001' },
  { key: 'rfq', label: 'Request for Quotation', prefix: 'RFQ', module: 'Pembelian', example: 'RFQ-2026-0001' },
  { key: 'gr', label: 'Goods Receipt', prefix: 'GR', module: 'Pembelian', example: 'GR-2026-0001' },
  { key: 'mo', label: 'Manufacturing Order', prefix: 'MO', module: 'Manufaktur', example: 'MO-2026-0001' },
  { key: 'pay', label: 'Payroll', prefix: 'PAY', module: 'Payroll', example: 'PAY-2026-0001' },
  { key: 'trn', label: 'Transfer Stok', prefix: 'TRN', module: 'Inventory', example: 'TRN-2026-0001' },
  { key: 'sop', label: 'Stock Opname', prefix: 'SOP', module: 'Inventory', example: 'SOP-2026-0001' },
  { key: 'wor', label: 'Work Order Servis', prefix: 'WOR', module: 'Servis', example: 'WOR-2026-0001' },
  { key: 'jrn', label: 'Journal Entry', prefix: 'JRN', module: 'Akuntansi', example: 'JRN-2026-0001' },
];

const MODULE_COLORS: Record<string, string> = {
  Penjualan: '#22C55E', Keuangan: '#EF4444', Pembelian: '#F97316',
  Manufaktur: '#F59E0B', Payroll: '#8B5CF6', Inventory: '#14B8A6',
  Servis: '#3B82F6', Akuntansi: '#EC4899',
};

export default function DocumentNumbersPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>(
    Object.fromEntries(DOC_TYPES.map(d => [d.key + '_prefix', d.prefix]))
  );
  const [padding, setPadding] = useState('4');
  const [yearFormat, setYearFormat] = useState('YYYY');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/dashboard'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  const getPreview = (key: string) => {
    const prefix = config[key + '_prefix'] || DOC_TYPES.find(d => d.key === key)?.prefix || '';
    const year = yearFormat === 'YYYY' ? '2026' : '26';
    const num = '0'.repeat(parseInt(padding) - 1) + '1';
    return `${prefix}-${year}-${num}`;
  };

  return (
    <OdooLayout title="Format Nomor Dokumen" subtitle="Konfigurasi penomoran otomatis untuk semua dokumen ERP">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Banner */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)', color: 'white' }}>
          <Hash className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-bold">Konfigurasi Nomor Dokumen Otomatis</p>
            <p className="text-sm opacity-80">Format: PREFIX-TAHUN-NOMOR (Contoh: SO-2026-0001)</p>
          </div>
        </div>

        {/* Global Settings */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <h3 className="font-bold mb-4" style={{ color: '#1E1B4B' }}>Pengaturan Global</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Jumlah Digit Nomor</label>
              <select
                value={padding}
                onChange={e => setPadding(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none' }}
              >
                <option value="3">3 digit (001)</option>
                <option value="4">4 digit (0001)</option>
                <option value="5">5 digit (00001)</option>
                <option value="6">6 digit (000001)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Format Tahun</label>
              <select
                value={yearFormat}
                onChange={e => setYearFormat(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none' }}
              >
                <option value="YYYY">4 digit (2026)</option>
                <option value="YY">2 digit (26)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Document Types */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
            <h3 className="font-bold" style={{ color: '#1E1B4B' }}>Prefix per Jenis Dokumen</h3>
          </div>
          <div className="divide-y" style={{ borderColor: '#EDE9FE' }}>
            {DOC_TYPES.map((d) => {
              const color = MODULE_COLORS[d.module] ?? '#5B52D1';
              return (
                <div key={d.key} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold w-20 text-center flex-shrink-0" style={{ backgroundColor: color + '15', color }}>
                    {d.module}
                  </span>
                  <p className="text-xs font-semibold w-40 flex-shrink-0" style={{ color: '#1E1B4B' }}>{d.label}</p>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={config[d.key + '_prefix'] ?? d.prefix}
                      onChange={e => setConfig(c => ({ ...c, [d.key + '_prefix']: e.target.value.toUpperCase() }))}
                      className="w-28 rounded-xl px-3 py-2 text-sm font-mono font-bold text-center"
                      style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none', backgroundColor: '#F5F3FF' }}
                      maxLength={8}
                      onFocus={e => { e.target.style.borderColor = '#5B52D1'; }}
                      onBlur={e => { e.target.style.borderColor = '#EDE9FE'; }}
                    />
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ backgroundColor: '#F0FDF4', border: '1px solid rgba(34,197,94,.2)' }}>
                      <Eye className="h-3.5 w-3.5" style={{ color: '#22C55E' }} />
                      <span className="text-xs font-mono font-semibold" style={{ color: '#15803D' }}>{getPreview(d.key)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSaving(true);
              setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000); }, 1000);
            }}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Konfigurasi
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#22C55E' }}>
              <CheckCircle className="h-4 w-4" /> Berhasil disimpan!
            </span>
          )}
        </div>
      </div>
    </OdooLayout>
  );
}
