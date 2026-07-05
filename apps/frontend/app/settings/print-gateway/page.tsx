'use client';

import { useEffect, useState, useCallback } from 'react';
import { Printer, Save, RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { getPrintConfig, savePrintConfig, checkPrinterStatus, DEFAULT_PRINT_CONFIG, type PrintConfig } from '../../../lib/printService';

const PURPLE = '#8C57FF';
const BORDER = '#EDE9FE';

type Status = 'idle' | 'loading' | 'ok' | 'error';

interface PrinterStatus {
  name: string;
  online: boolean;
  error?: string;
}

export default function PrintGatewayPage() {
  const [cfg, setCfg] = useState<PrintConfig>(DEFAULT_PRINT_CONFIG);
  const [saved, setSaved] = useState(false);

  const [checking, setChecking] = useState(false);
  const [invStatus, setInvStatus]   = useState<PrinterStatus | null>(null);
  const [sjStatus,  setSjStatus]    = useState<PrinterStatus | null>(null);
  const [cupsOnline, setCupsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    setCfg(getPrintConfig());
  }, []);

  const handleSave = () => {
    savePrintConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCheck = useCallback(async () => {
    setChecking(true);
    setInvStatus(null);
    setSjStatus(null);
    setCupsOnline(null);
    try {
      const result = await checkPrinterStatus();
      setInvStatus(result.invoice as PrinterStatus);
      setSjStatus(result.suratJalan as PrinterStatus);
      setCupsOnline(result.invoice.online || result.suratJalan.online);
    } catch (e: any) {
      setCupsOnline(false);
    } finally {
      setChecking(false);
    }
  }, []);

  const field = (label: string, key: keyof PrintConfig, placeholder: string, hint?: string) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{label}</label>
      <input
        className="w-full rounded-lg px-4 py-2.5 text-sm font-mono outline-none transition-colors"
        style={{ border: `1.5px solid ${BORDER}`, color: '#1E1B4B', background: '#fff' }}
        placeholder={placeholder}
        value={cfg[key]}
        onChange={e => setCfg(prev => ({ ...prev, [key]: e.target.value }))}
        onFocus={e => { e.target.style.borderColor = PURPLE; }}
        onBlur={e => { e.target.style.borderColor = BORDER; }}
      />
      {hint && <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{hint}</p>}
    </div>
  );

  const StatusBadge = ({ status }: { status: PrinterStatus | null }) => {
    if (!status) return <span className="text-xs" style={{ color: '#9CA3AF' }}>—</span>;
    return status.online
      ? <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#16A34A' }}><CheckCircle size={12} /> Online</span>
      : <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#DC2626' }}><AlertCircle size={12} /> Offline{status.error ? ` (${status.error})` : ''}</span>;
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Print Gateway (CUPS)</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
          Konfigurasi koneksi ke CUPS print server (VM Linux Mint di Proxmox)
        </p>
      </div>

      {/* Info Box */}
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(140,87,255,.06)', border: `1.5px solid ${BORDER}` }}>
        <Printer className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: PURPLE }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>Setup CUPS di VM Linux Mint</p>
          <ul className="text-xs mt-1.5 space-y-1" style={{ color: '#374151' }}>
            <li>1. Buka <code className="bg-purple-50 px-1 rounded">http://IP-VM:631</code> dari browser</li>
            <li>2. Tambahkan printer EPSON_LX-310 dan EPSON_L1250_Series</li>
            <li>3. Aktifkan <strong>Share This Printer</strong> dan <strong>Allow printing from the Internet</strong></li>
            <li>4. Di <code className="bg-purple-50 px-1 rounded">/etc/cups/cupsd.conf</code> tambahkan: <code className="bg-purple-50 px-1 rounded">Listen *:631</code></li>
          </ul>
        </div>
      </div>

      {/* Config Form */}
      <div className="rounded-2xl p-6 space-y-5 bg-white"
        style={{ border: `1.5px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
        <h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Konfigurasi Server</h2>

        {field(
          'IP & Port CUPS Server',
          'cupsHost',
          '192.168.18.49:361',
          'IP address VM Linux Mint beserta port CUPS (default: 631). Contoh: 192.168.18.49:631'
        )}

        <hr style={{ borderColor: BORDER }} />

        <h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Nama Printer di CUPS</h2>

        {field(
          'Printer Invoice (EPSON LX-310)',
          'printerInvoice',
          'EPSON_LX-310',
          'Nama printer di CUPS untuk cetak Invoice (A4 / dot matrix). Cek di http://IP:631/printers'
        )}

        {field(
          'Printer Surat Jalan (EPSON L1250)',
          'printerSuratJalan',
          'EPSON_L1250_Series',
          'Nama printer di CUPS untuk cetak Surat Jalan (A4 inkjet). Cek di http://IP:631/printers'
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition"
            style={{ backgroundColor: PURPLE }}>
            <Save className="h-4 w-4" />
            {saved ? 'Tersimpan ✓' : 'Simpan Konfigurasi'}
          </button>

          <button
            onClick={handleCheck}
            disabled={checking}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{ backgroundColor: '#F3F4F6', color: '#1E1B4B' }}>
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            Test Koneksi
          </button>
        </div>
      </div>

      {/* Status Panel */}
      {(invStatus || sjStatus || cupsOnline === false) && (
        <div className="rounded-2xl p-5 bg-white space-y-4"
          style={{ border: `1.5px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#1E1B4B' }}>
            {cupsOnline
              ? <Wifi className="h-4 w-4" style={{ color: '#16A34A' }} />
              : <WifiOff className="h-4 w-4" style={{ color: '#DC2626' }} />}
            Status Printer
          </h2>

          {cupsOnline === false && !invStatus?.online && !sjStatus?.online && (
            <div className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,.06)', border: '1.5px solid rgba(239,68,68,.2)', color: '#DC2626' }}>
              <p className="font-semibold">Tidak bisa terhubung ke CUPS server</p>
              <p className="text-xs mt-1">Pastikan VM Linux Mint menyala, IP benar, dan port {cfg.cupsHost.split(':')[1] ?? '631'} terbuka di firewall.</p>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                <th className="text-left py-2 text-xs font-semibold" style={{ color: '#9CA3AF' }}>Dokumen</th>
                <th className="text-left py-2 text-xs font-semibold" style={{ color: '#9CA3AF' }}>Printer</th>
                <th className="text-left py-2 text-xs font-semibold" style={{ color: '#9CA3AF' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td className="py-2.5 font-medium" style={{ color: '#1E1B4B' }}>Invoice</td>
                <td className="py-2.5 font-mono text-xs" style={{ color: '#374151' }}>{cfg.printerInvoice}</td>
                <td className="py-2.5"><StatusBadge status={invStatus} /></td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium" style={{ color: '#1E1B4B' }}>Surat Jalan</td>
                <td className="py-2.5 font-mono text-xs" style={{ color: '#374151' }}>{cfg.printerSuratJalan}</td>
                <td className="py-2.5"><StatusBadge status={sjStatus} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Access */}
      <div className="rounded-2xl p-4 text-xs" style={{ background: '#F9FAFB', border: `1px solid ${BORDER}` }}>
        <p className="font-semibold mb-2" style={{ color: '#1E1B4B' }}>Link cepat CUPS Admin</p>
        <a
          href={`http://${cfg.cupsHost}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: PURPLE }}>
          http://{cfg.cupsHost} — Buka CUPS Admin Panel
        </a>
      </div>
    </div>
  );
}
