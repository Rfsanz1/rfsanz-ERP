'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { FileBarChart, Download, RefreshCw, CheckCircle, Clock, Sparkles } from 'lucide-react';

const REPORT_TEMPLATES = [
  { id: 'sales-monthly', name: 'Laporan Penjualan Bulanan', desc: 'Summary revenue, order, dan pelanggan per bulan', module: 'Penjualan', time: '~15 detik' },
  { id: 'inventory-stock', name: 'Laporan Stok Inventory', desc: 'Stock card, mutasi, dan valuasi seluruh produk', module: 'Inventory', time: '~20 detik' },
  { id: 'finance-pl', name: 'Laporan Laba & Rugi', desc: 'P&L lengkap dengan breakdown per kategori', module: 'Keuangan', time: '~25 detik' },
  { id: 'hr-payroll', name: 'Rekap Gaji Karyawan', desc: 'Slip gaji massal, PPh21, BPJS per periode', module: 'Payroll', time: '~30 detik' },
  { id: 'purchasing-analysis', name: 'Analisis Pembelian', desc: 'Analisis vendor, harga, dan efisiensi pengadaan', module: 'Pembelian', time: '~18 detik' },
  { id: 'crm-pipeline', name: 'Laporan Pipeline CRM', desc: 'Win rate, lost reason, dan forecast CRM', module: 'CRM', time: '~12 detik' },
  { id: 'manufacturing-cost', name: 'Biaya Produksi', desc: 'Cost per unit, BOM usage, efisiensi produksi', module: 'Manufaktur', time: '~22 detik' },
  { id: 'executive-summary', name: 'Executive Summary', desc: 'Ringkasan eksekutif seluruh modul ERP', module: 'All', time: '~45 detik' },
];

const MODULE_COLORS: Record<string, string> = {
  Penjualan: '#22C55E', Inventory: '#14B8A6', Keuangan: '#EF4444',
  Payroll: '#8B5CF6', Pembelian: '#F97316', CRM: '#3B82F6',
  Manufaktur: '#F59E0B', All: '#5B52D1',
};

export default function AiReportGeneratorPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string[]>([]);
  const [period, setPeriod] = useState('2026-05');
  const [format, setFormat] = useState('pdf');

  useEffect(() => {
    if (!token) { router.push('/dashboard'); return; }
    setMounted(true);
  }, [token]);

  const generateReport = (id: string, time: string) => {
    const ms = parseInt(time.replace('~', '').replace(' detik', '')) * 1000;
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      setGenerated(g => [...g, id]);
    }, Math.min(ms, 3000));
  };

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="AI Report Generator" subtitle="Generate laporan otomatis dengan kecerdasan AI">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Banner */}
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white' }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <FileBarChart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI Report Generator</h2>
              <p className="text-sm opacity-80">Generate laporan profesional secara otomatis dari seluruh data ERP</p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: '#1E1B4B' }}>Pengaturan Laporan</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Periode</label>
              <input
                type="month"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Format Output</label>
              <div className="flex gap-2">
                {['pdf', 'excel', 'word'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase transition"
                    style={{
                      backgroundColor: format === f ? '#8B5CF6' : '#F5F3FF',
                      color: format === f ? 'white' : '#6B7280',
                      border: `1.5px solid ${format === f ? '#8B5CF6' : '#EDE9FE'}`,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Report Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORT_TEMPLATES.map((r) => {
            const isGenerating = generating === r.id;
            const isDone = generated.includes(r.id);
            const color = MODULE_COLORS[r.module] ?? '#5B52D1';
            return (
              <div
                key={r.id}
                className="rounded-2xl p-5 flex items-start gap-4"
                style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${isDone ? color + '40' : '#EDE9FE'}` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: color + '15' }}>
                  <FileBarChart className="h-5 w-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm" style={{ color: '#1E1B4B' }}>{r.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: color + '15', color }}>
                      {r.module}
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>{r.desc}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => !isGenerating && !isDone && generateReport(r.id, r.time)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                      style={{
                        backgroundColor: isDone ? 'rgba(34,197,94,.1)' : color + '15',
                        color: isDone ? '#22C55E' : color,
                      }}
                    >
                      {isGenerating ? (
                        <><RefreshCw className="h-3 w-3 animate-spin" /> Generating...</>
                      ) : isDone ? (
                        <><CheckCircle className="h-3 w-3" /> Selesai</>
                      ) : (
                        <><Sparkles className="h-3 w-3" /> Generate {format.toUpperCase()}</>
                      )}
                    </button>
                    {isDone && (
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#F5F3FF', color: '#1E1B4B' }}>
                        <Download className="h-3 w-3" /> Download
                      </button>
                    )}
                    <span className="ml-auto text-[10px] flex items-center gap-1" style={{ color: '#9CA3AF' }}>
                      <Clock className="h-3 w-3" /> {r.time}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Report */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#F5F3FF', border: '1.5px dashed #EDE9FE' }}>
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
            <Sparkles className="h-4 w-4" style={{ color: '#8B5CF6' }} /> Custom Report dengan AI
          </h3>
          <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Deskripsikan laporan yang Anda butuhkan, AI akan membuat templatenya</p>
          <div className="flex gap-2">
            <input
              placeholder="Contoh: Buat laporan penjualan per salesman dan per produk untuk Q1 2026..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm"
              style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none', backgroundColor: 'white' }}
            />
            <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
              Generate
            </button>
          </div>
        </div>
      </div>
    </OdooLayout>
  );
}
