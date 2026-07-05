/**
 * POST /api/print-agent
 * Kirim print job ke Print Agent (script Node.js ringan di VM Linux Mint).
 * Agent menerima HTTP biasa dan forward ke printer lokal via `lp`.
 *
 * Lebih mudah dari CUPS remote — tidak perlu expose CUPS ke jaringan.
 *
 * Body:
 *   type    : 'invoice' | 'surat-jalan'
 *   html    : string
 *   title?  : string
 */

import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_AGENT_URL      = process.env.PRINT_AGENT_URL      ?? 'http://192.168.18.49:6631';
const DEFAULT_PRINTER_INV    = process.env.CUPS_PRINTER_INVOICE  ?? 'EPSON_LX-310';
const DEFAULT_PRINTER_SJ     = process.env.CUPS_PRINTER_SJ       ?? 'EPSON_L1250_Series';

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

    const agentUrl   = req.headers.get('x-agent-url')       ?? DEFAULT_AGENT_URL;
    const printerInv = req.headers.get('x-printer-invoice') ?? DEFAULT_PRINTER_INV;
    const printerSj  = req.headers.get('x-printer-sj')      ?? DEFAULT_PRINTER_SJ;
    const printer    = type === 'invoice' ? printerInv : printerSj;

    const agentRes = await fetch(`${agentUrl}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer, html, title }),
      signal: AbortSignal.timeout(12000),
    });

    const data = await agentRes.json().catch(() => ({}));

    if (!agentRes.ok || data.error) {
      return NextResponse.json(
        { error: data.error ?? `Agent error ${agentRes.status}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, printer, message: data.message ?? `Job terkirim ke ${printer}` });

  } catch (err: any) {
    const msg  = err?.message ?? String(err);
    const conn = msg.includes('ECONNREFUSED') || msg.includes('fetch failed') || msg.includes('timeout') || msg.includes('EHOSTUNREACH');
    return NextResponse.json(
      { error: conn ? 'Print Agent tidak bisa dihubungi. Pastikan agent sudah dijalankan di VM Linux Mint.' : msg },
      { status: conn ? 503 : 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const agentUrl = req.nextUrl.searchParams.get('url') ?? DEFAULT_AGENT_URL;
  try {
    const res  = await fetch(`${agentUrl}/status`, { signal: AbortSignal.timeout(4000) });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ online: res.ok, agentUrl, ...data });
  } catch (e: any) {
    return NextResponse.json({ online: false, agentUrl, error: e?.message ?? 'timeout' });
  }
}
