/**
 * printService.ts
 * Utility untuk kirim print job ke CUPS server via /api/print
 */

const STORAGE_KEY = 'erp_print_config';

export interface PrintConfig {
  cupsHost: string;
  printerInvoice: string;
  printerSuratJalan: string;
}

export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  cupsHost:          '192.168.18.49:361',
  printerInvoice:    'EPSON_LX-310',
  printerSuratJalan: 'EPSON_L1250_Series',
};

export function getPrintConfig(): PrintConfig {
  if (typeof window === 'undefined') return DEFAULT_PRINT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRINT_CONFIG;
    return { ...DEFAULT_PRINT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRINT_CONFIG;
  }
}

export function savePrintConfig(cfg: PrintConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export interface PrintResult {
  ok: boolean;
  message: string;
  printer?: string;
}

export async function printDocument(
  type: 'invoice' | 'surat-jalan',
  html: string,
  title?: string,
): Promise<PrintResult> {
  const cfg = getPrintConfig();
  try {
    const res = await fetch('/api/print', {
      method: 'POST',
      headers: {
        'Content-Type':       'application/json',
        'x-cups-host':        cfg.cupsHost,
        'x-printer-invoice':  cfg.printerInvoice,
        'x-printer-sj':       cfg.printerSuratJalan,
      },
      body: JSON.stringify({ type, html, title }),
    });
    const data = await res.json();
    if (!res.ok || data.error) return { ok: false, message: data.error ?? 'Gagal print' };
    return { ok: true, message: data.message, printer: data.printer };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Tidak bisa terhubung ke print server' };
  }
}

export async function checkPrinterStatus(): Promise<{
  cupsHost: string;
  invoice: { name: string; online: boolean; error?: string };
  suratJalan: { name: string; online: boolean; error?: string };
}> {
  const cfg = getPrintConfig();
  const params = new URLSearchParams({
    host:    cfg.cupsHost,
    invoice: cfg.printerInvoice,
    sj:      cfg.printerSuratJalan,
  });
  const res = await fetch(`/api/print?${params}`);
  return res.json();
}

export function buildInvoiceHtml(invoice: {
  noInvoice: string;
  tanggal: string;
  dueDate?: string;
  customerName: string;
  salesName?: string;
  items: { nama: string; qty: number; harga: number; diskonItem?: number; subtotal: number; unit?: string }[];
  diskonTotal?: number;
  pajak?: number;
  ongkir?: number;
  grandTotal: number;
  metodePembayaran?: string;
  notes?: string;
  companyName?: string;
}): string {
  const fmtRp = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
  const fmtDate = (s: string) => {
    try { return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch { return s; }
  };

  const rows = invoice.items.map(it => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;">${it.nama}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${it.qty} ${it.unit ?? ''}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right;">${fmtRp(it.harga)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right;">${it.diskonItem ? fmtRp(it.diskonItem) : '-'}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right;">${fmtRp(it.subtotal)}</td>
    </tr>`).join('');

  return `
<div style="max-width:720px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;font-size:10pt;">
  <table style="width:100%;margin-bottom:16px;">
    <tr>
      <td>
        <h2 style="margin:0;font-size:16pt;color:#1E1B4B;">${invoice.companyName ?? 'Gentong Mas'}</h2>
        <p style="margin:2px 0;font-size:9pt;color:#666;">Sistem ERP — Invoice</p>
      </td>
      <td style="text-align:right;">
        <h3 style="margin:0;color:#1E1B4B;">INVOICE</h3>
        <p style="margin:2px 0;font-size:9pt;"><strong>${invoice.noInvoice}</strong></p>
        <p style="margin:2px 0;font-size:9pt;">Tanggal: ${fmtDate(invoice.tanggal)}</p>
        ${invoice.dueDate ? `<p style="margin:2px 0;font-size:9pt;">Jatuh tempo: ${fmtDate(invoice.dueDate)}</p>` : ''}
      </td>
    </tr>
  </table>

  <table style="width:100%;margin-bottom:16px;">
    <tr>
      <td style="width:50%;vertical-align:top;">
        <p style="margin:0;font-size:9pt;color:#888;">Tagihan kepada:</p>
        <p style="margin:2px 0;font-weight:bold;">${invoice.customerName}</p>
      </td>
      <td style="width:50%;vertical-align:top;">
        ${invoice.salesName ? `<p style="margin:0;font-size:9pt;color:#888;">Sales:</p><p style="margin:2px 0;">${invoice.salesName}</p>` : ''}
        ${invoice.metodePembayaran ? `<p style="margin:4px 0 0;font-size:9pt;color:#888;">Metode:</p><p style="margin:2px 0;">${invoice.metodePembayaran}</p>` : ''}
      </td>
    </tr>
  </table>

  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
    <thead>
      <tr style="background:#1E1B4B;color:#fff;">
        <th style="padding:6px 8px;text-align:left;border:1px solid #1E1B4B;">Produk / Jasa</th>
        <th style="padding:6px 8px;text-align:center;border:1px solid #1E1B4B;">Qty</th>
        <th style="padding:6px 8px;text-align:right;border:1px solid #1E1B4B;">Harga</th>
        <th style="padding:6px 8px;text-align:right;border:1px solid #1E1B4B;">Diskon</th>
        <th style="padding:6px 8px;text-align:right;border:1px solid #1E1B4B;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <table style="width:100%;margin-bottom:16px;">
    <tr>
      <td style="width:60%;"></td>
      <td style="width:40%;">
        <table style="width:100%;border-collapse:collapse;">
          ${invoice.diskonTotal ? `<tr><td style="padding:3px 8px;font-size:9pt;">Diskon</td><td style="padding:3px 8px;text-align:right;font-size:9pt;">${fmtRp(invoice.diskonTotal)}</td></tr>` : ''}
          ${invoice.pajak ? `<tr><td style="padding:3px 8px;font-size:9pt;">Pajak</td><td style="padding:3px 8px;text-align:right;font-size:9pt;">${fmtRp(invoice.pajak)}</td></tr>` : ''}
          ${invoice.ongkir ? `<tr><td style="padding:3px 8px;font-size:9pt;">Ongkos Kirim</td><td style="padding:3px 8px;text-align:right;font-size:9pt;">${fmtRp(invoice.ongkir)}</td></tr>` : ''}
          <tr style="background:#1E1B4B;color:#fff;">
            <td style="padding:6px 8px;font-weight:bold;">TOTAL</td>
            <td style="padding:6px 8px;text-align:right;font-weight:bold;font-size:12pt;">${fmtRp(invoice.grandTotal)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  ${invoice.notes ? `<p style="font-size:9pt;color:#555;border-top:1px solid #eee;padding-top:8px;">Catatan: ${invoice.notes}</p>` : ''}

  <p style="font-size:8pt;color:#aaa;text-align:center;margin-top:24px;border-top:1px solid #eee;padding-top:8px;">
    Dicetak otomatis oleh Gentong Mas ERP
  </p>
</div>`;
}

export function buildSuratJalanHtml(data: {
  noSuratJalan: string;
  tanggal: string;
  noInvoice?: string;
  customerName: string;
  alamat?: string;
  items: { nama: string; qty: number; unit?: string; keterangan?: string }[];
  pengirim?: string;
  penerima?: string;
  supir?: string;
  platKendaraan?: string;
  companyName?: string;
}): string {
  const fmtDate = (s: string) => {
    try { return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch { return s; }
  };

  const rows = data.items.map((it, i) => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${it.nama}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${it.qty}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${it.unit ?? 'pcs'}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${it.keterangan ?? ''}</td>
    </tr>`).join('');

  return `
<div style="max-width:720px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;font-size:10pt;">
  <table style="width:100%;margin-bottom:16px;">
    <tr>
      <td>
        <h2 style="margin:0;font-size:16pt;color:#1E1B4B;">${data.companyName ?? 'Gentong Mas'}</h2>
        <p style="margin:2px 0;font-size:9pt;color:#666;">Sistem ERP</p>
      </td>
      <td style="text-align:right;">
        <h3 style="margin:0;color:#1E1B4B;">SURAT JALAN</h3>
        <p style="margin:2px 0;font-size:9pt;"><strong>${data.noSuratJalan}</strong></p>
        <p style="margin:2px 0;font-size:9pt;">Tanggal: ${fmtDate(data.tanggal)}</p>
        ${data.noInvoice ? `<p style="margin:2px 0;font-size:9pt;">Ref Invoice: ${data.noInvoice}</p>` : ''}
      </td>
    </tr>
  </table>

  <table style="width:100%;margin-bottom:16px;border:1px solid #ddd;border-collapse:collapse;">
    <tr>
      <td style="padding:6px 8px;border:1px solid #ddd;font-size:9pt;color:#888;width:20%;">Kepada</td>
      <td style="padding:6px 8px;border:1px solid #ddd;font-weight:bold;">${data.customerName}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;font-size:9pt;color:#888;width:20%;">Alamat</td>
      <td style="padding:6px 8px;border:1px solid #ddd;">${data.alamat ?? '-'}</td>
    </tr>
    ${data.supir ? `<tr>
      <td style="padding:6px 8px;border:1px solid #ddd;font-size:9pt;color:#888;">Supir</td>
      <td style="padding:6px 8px;border:1px solid #ddd;">${data.supir}</td>
      <td style="padding:6px 8px;border:1px solid #ddd;font-size:9pt;color:#888;">Plat</td>
      <td style="padding:6px 8px;border:1px solid #ddd;">${data.platKendaraan ?? '-'}</td>
    </tr>` : ''}
  </table>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="background:#1E1B4B;color:#fff;">
        <th style="padding:6px 8px;border:1px solid #1E1B4B;">No</th>
        <th style="padding:6px 8px;text-align:left;border:1px solid #1E1B4B;">Nama Barang</th>
        <th style="padding:6px 8px;border:1px solid #1E1B4B;">Jumlah</th>
        <th style="padding:6px 8px;border:1px solid #1E1B4B;">Satuan</th>
        <th style="padding:6px 8px;text-align:left;border:1px solid #1E1B4B;">Keterangan</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <table style="width:100%;margin-top:32px;">
    <tr>
      <td style="width:33%;text-align:center;">
        <p style="font-size:9pt;margin-bottom:48px;">Pengirim,</p>
        <p style="border-top:1px solid #000;padding-top:4px;font-size:9pt;">${data.pengirim ?? '_______________'}</p>
      </td>
      <td style="width:33%;text-align:center;">
        <p style="font-size:9pt;margin-bottom:48px;">Supir / Kurir,</p>
        <p style="border-top:1px solid #000;padding-top:4px;font-size:9pt;">${data.supir ?? '_______________'}</p>
      </td>
      <td style="width:33%;text-align:center;">
        <p style="font-size:9pt;margin-bottom:48px;">Penerima,</p>
        <p style="border-top:1px solid #000;padding-top:4px;font-size:9pt;">${data.penerima ?? '_______________'}</p>
      </td>
    </tr>
  </table>

  <p style="font-size:8pt;color:#aaa;text-align:center;margin-top:24px;border-top:1px solid #eee;padding-top:8px;">
    Dicetak otomatis oleh Gentong Mas ERP
  </p>
</div>`;
}
