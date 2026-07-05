/**
 * POST /api/print
 * Kirim dokumen ke printer CUPS via IPP protocol.
 *
 * Body:
 *   type        : 'invoice' | 'surat-jalan'
 *   html        : string   — konten HTML yang akan dicetak
 *   title?      : string   — nama job print (default: 'ERP Print')
 *
 * Konfigurasi printer dibaca dari localStorage via header atau dari env:
 *   x-cups-host      : IP:port CUPS server (default: 192.168.18.49:361)
 *   x-printer-invoice: nama printer invoice (default: EPSON_LX-310)
 *   x-printer-sj     : nama printer surat jalan (default: EPSON_L1250_Series)
 */

import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_CUPS_HOST    = process.env.CUPS_HOST    ?? '192.168.18.49:361';
const DEFAULT_PRINTER_INV  = process.env.CUPS_PRINTER_INVOICE ?? 'EPSON_LX-310';
const DEFAULT_PRINTER_SJ   = process.env.CUPS_PRINTER_SJ      ?? 'EPSON_L1250_Series';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, html, title = 'ERP Print' } = body as {
      type: 'invoice' | 'surat-jalan';
      html: string;
      title?: string;
    };

    if (!type || !html) {
      return NextResponse.json({ error: 'type dan html harus diisi' }, { status: 400 });
    }

    const cupsHost   = req.headers.get('x-cups-host')       ?? DEFAULT_CUPS_HOST;
    const printerInv = req.headers.get('x-printer-invoice') ?? DEFAULT_PRINTER_INV;
    const printerSj  = req.headers.get('x-printer-sj')      ?? DEFAULT_PRINTER_SJ;

    const printerName = type === 'invoice' ? printerInv : printerSj;
    const cupsUrl     = `http://${cupsHost}/printers/${printerName}`;

    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; }
  @media print {
    body { margin: 0; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>${html}</body>
</html>`;

    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(fullHtml);

    const jobName    = encodeURIComponent(title);
    const ippUrl     = `ipp://${cupsHost}/printers/${printerName}`;

    const buildIppRequest = (jobTitle: string, data: Uint8Array): Uint8Array => {
      const buf: number[] = [];

      const writeInt16 = (v: number) => { buf.push((v >> 8) & 0xff, v & 0xff); };
      const writeInt32 = (v: number) => { buf.push((v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff); };
      const writeStr   = (s: string) => {
        const bytes = encoder.encode(s);
        writeInt16(bytes.length);
        bytes.forEach(b => buf.push(b));
      };
      const writeAttr = (tag: number, name: string, value: string) => {
        buf.push(tag);
        writeStr(name);
        writeStr(value);
      };
      const writeAttrInt = (tag: number, name: string, value: number) => {
        buf.push(tag);
        writeStr(name);
        writeInt16(4);
        writeInt32(value);
      };

      writeInt16(0x0101);
      writeInt16(0x0002);
      writeInt32(1);

      buf.push(0x01);
      writeAttr(0x47, 'attributes-charset', 'utf-8');
      writeAttr(0x48, 'attributes-natural-language', 'en');
      writeAttr(0x45, 'printer-uri', ippUrl);
      writeAttr(0x42, 'job-name', jobTitle);
      writeAttr(0x22, 'ipp-attribute-fidelity', '');
      buf[buf.length - 2] = 0x00; buf[buf.length - 1] = 0x00;

      buf.push(0x02);
      writeAttr(0x49, 'document-format', 'text/html');

      buf.push(0x03);
      data.forEach(b => buf.push(b));

      return new Uint8Array(buf);
    };

    const ippBody = buildIppRequest(title, htmlBytes);

    const cupsResponse = await fetch(`http://${cupsHost}/printers/${printerName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ipp',
        'Content-Length': String(ippBody.length),
      },
      body: ippBody,
      signal: AbortSignal.timeout(10000),
    });

    if (!cupsResponse.ok && cupsResponse.status !== 200) {
      const errText = await cupsResponse.text().catch(() => '');
      return NextResponse.json(
        { error: `CUPS error ${cupsResponse.status}: ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      printer: printerName,
      cupsHost,
      message: `Job print terkirim ke ${printerName}`,
    });

  } catch (err: any) {
    const msg = err?.message ?? String(err);
    const isConn = msg.includes('ECONNREFUSED') || msg.includes('fetch failed') || msg.includes('timeout');
    return NextResponse.json(
      {
        error: isConn
          ? `Tidak bisa terhubung ke CUPS server. Pastikan VM Linux Mint menyala dan IP benar.`
          : msg,
      },
      { status: isConn ? 503 : 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const cupsHost   = req.nextUrl.searchParams.get('host')    ?? DEFAULT_CUPS_HOST;
  const printerInv = req.nextUrl.searchParams.get('invoice') ?? DEFAULT_PRINTER_INV;
  const printerSj  = req.nextUrl.searchParams.get('sj')      ?? DEFAULT_PRINTER_SJ;

  const checkPrinter = async (name: string) => {
    try {
      const res = await fetch(`http://${cupsHost}/printers/${name}`, {
        method: 'GET',
        headers: { Accept: 'text/html' },
        signal: AbortSignal.timeout(4000),
      });
      return { name, online: res.ok || res.status < 500, status: res.status };
    } catch (e: any) {
      return { name, online: false, error: e?.message ?? 'timeout' };
    }
  };

  const [inv, sj] = await Promise.all([
    checkPrinter(printerInv),
    checkPrinter(printerSj),
  ]);

  return NextResponse.json({ cupsHost, invoice: inv, suratJalan: sj });
}
