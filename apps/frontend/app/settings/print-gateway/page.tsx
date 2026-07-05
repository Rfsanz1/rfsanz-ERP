'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Printer, Save, RefreshCw, CheckCircle, AlertCircle,
  Wifi, WifiOff, Download, Terminal, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  getPrintConfig, savePrintConfig, checkPrinterStatus,
  DEFAULT_PRINT_CONFIG, type PrintConfig,
} from '../../../lib/printService';

const PURPLE = '#8C57FF';
const BORDER = '#EDE9FE';
const GREEN  = '#059669';

interface StatusResult {
  online:     boolean;
  printers?:  string[];
  invoice?:   { name: string; online: boolean; error?: string };
  suratJalan?:{ name: string; online: boolean; error?: string };
  error?:     string;
  hostname?:  string;
}

export default function PrintGatewayPage() {
  const [cfg, setCfg]         = useState<PrintConfig>(DEFAULT_PRINT_CONFIG);
  const [saved, setSaved]     = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus]   = useState<StatusResult | null>(null);
  const [showCupsGuide, setShowCupsGuide] = useState(false);

  useEffect(() => { setCfg(getPrintConfig()); }, []);

  const handleSave = () => {
    savePrintConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCheck = useCallback(async () => {
    setChecking(true);
    setStatus(null);
    try {
      const result = await checkPrinterStatus();
      setStatus(result as StatusResult);
    } catch (e: any) {
      setStatus({ online: false, error: e?.message ?? 'Tidak bisa terhubung' });
    } finally {
      setChecking(false);
    }
  }, []);

  const set = (key: keyof PrintConfig, val: string) =>
    setCfg(prev => ({ ...prev, [key]: val }));

  const Field = ({
    label, cfgKey, placeholder, hint, mono = true,
  }: { label: string; cfgKey: keyof PrintConfig; placeholder: string; hint?: string; mono?: boolean }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{label}</label>
      <input
        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none ${mono ? 'font-mono' : ''}`}
        style={{ border: `1.5px solid ${BORDER}`, color: '#1E1B4B', background: '#fff' }}
        placeholder={placeholder}
        value={cfg[cfgKey] as string}
        onChange={e => set(cfgKey, e.target.value)}
        onFocus={e => { e.target.style.borderColor = PURPLE; }}
        onBlur={e => { e.target.style.borderColor = BORDER; }}
      />
      {hint && <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{hint}</p>}
    </div>
  );

  const Badge = ({ ok, label }: { ok: boolean; label: string }) => ok
    ? <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: GREEN }}>
        <CheckCircle size={12}/> {label}
      </span>
    : <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#DC2626' }}>
        <AlertCircle size={12}/> {label}
      </span>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Print Gateway</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
          Cetak Invoice &amp; Surat Jalan langsung ke printer di VM Linux Mint (Proxmox)
        </p>
      </div>

      {/* ── Mode Selector ── */}
      <div className="rounded-2xl p-5 bg-white space-y-4"
        style={{ border: `1.5px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
        <h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Mode Koneksi</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Agent */}
          <button
            onClick={() => set('mode', 'agent')}
            className="rounded-xl p-4 text-left transition"
            style={{
              border: `2px solid ${cfg.mode === 'agent' ? PURPLE : BORDER}`,
              background: cfg.mode === 'agent' ? `${PURPLE}08` : '#fff',
            }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Terminal size={16} style={{ color: cfg.mode === 'agent' ? PURPLE : '#9CA3AF' }} />
              <span className="text-sm font-bold" style={{ color: cfg.mode === 'agent' ? PURPLE : '#1E1B4B' }}>
                Print Agent
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: `${GREEN}15`, color: GREEN }}>
                Disarankan
              </span>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Script ringan di VM. Tidak perlu expose CUPS ke jaringan. Lebih mudah.
            </p>
          </button>

          {/* CUPS langsung */}
          <button
            onClick={() => set('mode', 'cups')}
            className="rounded-xl p-4 text-left transition"
            style={{
              border: `2px solid ${cfg.mode === 'cups' ? PURPLE : BORDER}`,
              background: cfg.mode === 'cups' ? `${PURPLE}08` : '#fff',
            }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Printer size={16} style={{ color: cfg.mode === 'cups' ? PURPLE : '#9CA3AF' }} />
              <span className="text-sm font-bold" style={{ color: cfg.mode === 'cups' ? PURPLE : '#1E1B4B' }}>
                CUPS Langsung
              </span>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Koneksi IPP langsung ke CUPS server. Perlu konfigurasi remote access.
            </p>
          </button>
        </div>
      </div>

      {/* ── Konfigurasi Agent ── */}
      {cfg.mode === 'agent' && (
        <>
          {/* Panduan install */}
          <div className="rounded-2xl p-5 bg-white space-y-4"
            style={{ border: `1.5px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#1E1B4B' }}>
              <Terminal size={15} style={{ color: PURPLE }} />
              Cara Install Print Agent di VM Linux Mint
            </h2>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                  style={{ background: PURPLE }}>1</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1" style={{ color: '#1E1B4B' }}>Download file agent ke VM Linux Mint</p>
                  <a
                    href="/print-agent/agent.js"
                    download="agent.js"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: PURPLE }}>
                    <Download size={12} /> Download agent.js
                  </a>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                    Atau buka terminal di VM dan ketik:
                  </p>
                  <code className="block mt-1 text-xs p-2 rounded-lg"
                    style={{ background: '#1E1B4B', color: '#A5B4FC' }}>
                    {`curl -o agent.js http://[IP-ERP]:5000/print-agent/agent.js`}
                  </code>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                  style={{ background: PURPLE }}>2</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1" style={{ color: '#1E1B4B' }}>Pastikan CUPS & Node.js terinstall di VM</p>
                  <code className="block text-xs p-2 rounded-lg"
                    style={{ background: '#1E1B4B', color: '#A5B4FC' }}>
                    {`sudo apt install -y cups nodejs npm\nsudo systemctl start cups\nsudo systemctl enable cups`}
                  </code>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                  style={{ background: PURPLE }}>3</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1" style={{ color: '#1E1B4B' }}>Jalankan agent</p>
                  <code className="block text-xs p-2 rounded-lg"
                    style={{ background: '#1E1B4B', color: '#A5B4FC' }}>
                    {`node agent.js`}
                  </code>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                    Untuk auto-start saat VM nyala, download juga <code>install-service.sh</code> dan jalankan:
                  </p>
                  <div className="flex gap-2 mt-1">
                    <a
                      href="/print-agent/install-service.sh"
                      download="install-service.sh"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: '#F3F4F6', color: '#1E1B4B' }}>
                      <Download size={11} /> install-service.sh
                    </a>
                  </div>
                  <code className="block mt-1.5 text-xs p-2 rounded-lg"
                    style={{ background: '#1E1B4B', color: '#A5B4FC' }}>
                    {`sudo bash install-service.sh`}
                  </code>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                  style={{ background: PURPLE }}>4</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1" style={{ color: '#1E1B4B' }}>Tambahkan printer di CUPS (lokal, di VM)</p>
                  <code className="block text-xs p-2 rounded-lg"
                    style={{ background: '#1E1B4B', color: '#A5B4FC' }}>
                    {`# Buka di browser (dari VM):\nhttp://localhost:631\n\n# Atau tambah via command line:\nsudo lpadmin -p EPSON_LX-310 -E -v usb://... -m everywhere\nsudo lpadmin -p EPSON_L1250_Series -E -v usb://... -m everywhere`}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Config form agent */}
          <div className="rounded-2xl p-6 space-y-5 bg-white"
            style={{ border: `1.5px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Konfigurasi Agent</h2>
            <Field
              label="URL Print Agent"
              cfgKey="agentUrl"
              placeholder="http://192.168.18.49:6631"
              hint="URL lengkap agent yang berjalan di VM Linux Mint. Default port: 6631"
            />
            <hr style={{ borderColor: BORDER }} />
            <h3 className="text-xs font-bold" style={{ color: '#1E1B4B' }}>Nama Printer di CUPS (di dalam VM)</h3>
            <Field
              label="Printer Invoice (EPSON LX-310)"
              cfgKey="printerInvoice"
              placeholder="EPSON_LX-310"
              hint="Cek nama printer: jalankan lpstat -p di terminal VM"
            />
            <Field
              label="Printer Surat Jalan (EPSON L1250)"
              cfgKey="printerSuratJalan"
              placeholder="EPSON_L1250_Series"
              hint="Cek nama printer: jalankan lpstat -p di terminal VM"
            />
          </div>
        </>
      )}

      {/* ── Konfigurasi CUPS langsung ── */}
      {cfg.mode === 'cups' && (
        <div className="rounded-2xl p-6 space-y-5 bg-white"
          style={{ border: `1.5px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Konfigurasi CUPS Server</h2>
            <button
              onClick={() => setShowCupsGuide(v => !v)}
              className="flex items-center gap-1 text-xs mt-1"
              style={{ color: PURPLE }}>
              {showCupsGuide ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
              {showCupsGuide ? 'Sembunyikan' : 'Lihat'} cara aktifkan CUPS remote access
            </button>
            {showCupsGuide && (
              <div className="mt-3 p-3 rounded-xl space-y-2 text-xs"
                style={{ background: '#F9FAFB', border: `1px solid ${BORDER}` }}>
                <p style={{ color: '#1E1B4B' }} className="font-semibold">Jalankan di VM Linux Mint:</p>
                <code className="block p-2 rounded-lg" style={{ background: '#1E1B4B', color: '#A5B4FC' }}>
                  {`# 1. Start CUPS dulu\nsudo systemctl start cups\nsudo systemctl enable cups\n\n# 2. Aktifkan remote access\nsudo cupsctl --remote-any\n\n# 3. Edit cupsd.conf\nsudo nano /etc/cups/cupsd.conf\n# Ubah: Listen localhost:631  →  Port 631\n# Tambah di bawah:\n#   <Location />\n#     Order allow,deny\n#     Allow all\n#   </Location>\n\n# 4. Restart CUPS\nsudo systemctl restart cups`}
                </code>
                <p style={{ color: '#DC2626' }} className="font-semibold mt-2">
                  ⚠️ Jika muncul error "cups host sedang turun":
                </p>
                <code className="block p-2 rounded-lg" style={{ background: '#1E1B4B', color: '#A5B4FC' }}>
                  {`sudo systemctl status cups    # cek status\nsudo systemctl start cups     # start ulang\nsudo journalctl -u cups -n 30  # lihat error`}
                </code>
                <p className="mt-1" style={{ color: '#6B7280' }}>
                  Jika masih error, gunakan mode <strong>Print Agent</strong> — jauh lebih mudah.
                </p>
              </div>
            )}
          </div>

          <Field
            label="IP & Port CUPS Server"
            cfgKey="cupsHost"
            placeholder="192.168.18.49:631"
            hint="Default CUPS port adalah 631 (bukan 361). Contoh: 192.168.18.49:631"
          />
          <hr style={{ borderColor: BORDER }} />
          <h3 className="text-xs font-bold" style={{ color: '#1E1B4B' }}>Nama Printer di CUPS</h3>
          <Field
            label="Printer Invoice (EPSON LX-310)"
            cfgKey="printerInvoice"
            placeholder="EPSON_LX-310"
          />
          <Field
            label="Printer Surat Jalan (EPSON L1250)"
            cfgKey="printerSuratJalan"
            placeholder="EPSON_L1250_Series"
          />
        </div>
      )}

      {/* ── Tombol Simpan & Test ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: PURPLE }}>
          <Save className="h-4 w-4" />
          {saved ? 'Tersimpan ✓' : 'Simpan'}
        </button>
        <button
          onClick={handleCheck}
          disabled={checking}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#F3F4F6', color: '#1E1B4B' }}>
          <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
          Test Koneksi
        </button>
      </div>

      {/* ── Status Panel ── */}
      {status && (
        <div className="rounded-2xl p-5 bg-white space-y-3"
          style={{ border: `1.5px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#1E1B4B' }}>
            {status.online
              ? <Wifi className="h-4 w-4" style={{ color: GREEN }} />
              : <WifiOff className="h-4 w-4" style={{ color: '#DC2626' }} />}
            Hasil Test Koneksi
          </h2>

          {status.online ? (
            <div className="rounded-xl px-4 py-3 text-sm"
              style={{ background: `${GREEN}08`, border: `1.5px solid ${GREEN}30`, color: GREEN }}>
              <p className="font-semibold">
                ✅ {cfg.mode === 'agent' ? 'Print Agent' : 'CUPS Server'} terhubung!
                {status.hostname && ` (${status.hostname})`}
              </p>
              {status.printers && status.printers.length > 0 && (
                <p className="text-xs mt-1 opacity-80">
                  Printer tersedia: {status.printers.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,.06)', border: '1.5px solid rgba(239,68,68,.2)', color: '#DC2626' }}>
              <p className="font-semibold">
                ❌ {cfg.mode === 'agent' ? 'Print Agent' : 'CUPS Server'} tidak bisa dihubungi
              </p>
              <p className="text-xs mt-1 opacity-80">
                {status.error ?? (cfg.mode === 'agent'
                  ? 'Pastikan node agent.js sudah berjalan di VM Linux Mint'
                  : 'Pastikan CUPS sudah aktif dan remote access sudah diaktifkan')}
              </p>
            </div>
          )}

          {/* Status per printer (mode CUPS) */}
          {cfg.mode === 'cups' && (status.invoice || status.suratJalan) && (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left py-2 text-xs font-semibold" style={{ color: '#9CA3AF' }}>Dokumen</th>
                  <th className="text-left py-2 text-xs font-semibold" style={{ color: '#9CA3AF' }}>Printer</th>
                  <th className="text-left py-2 text-xs font-semibold" style={{ color: '#9CA3AF' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {status.invoice && (
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td className="py-2.5 font-medium" style={{ color: '#1E1B4B' }}>Invoice</td>
                    <td className="py-2.5 font-mono text-xs">{cfg.printerInvoice}</td>
                    <td className="py-2.5"><Badge ok={status.invoice.online} label={status.invoice.online ? 'Online' : 'Offline'} /></td>
                  </tr>
                )}
                {status.suratJalan && (
                  <tr>
                    <td className="py-2.5 font-medium" style={{ color: '#1E1B4B' }}>Surat Jalan</td>
                    <td className="py-2.5 font-mono text-xs">{cfg.printerSuratJalan}</td>
                    <td className="py-2.5"><Badge ok={status.suratJalan.online} label={status.suratJalan.online ? 'Online' : 'Offline'} /></td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
