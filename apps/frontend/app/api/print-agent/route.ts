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
import fs from 'fs';
import path from 'path';

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
  const action   = req.nextUrl.searchParams.get('action');
  const agentUrl = req.nextUrl.searchParams.get('url') ?? DEFAULT_AGENT_URL;

  // ?action=setup → kembalikan bash script installer
  if (action === 'setup') {
    try {
      const agentJsPath = path.join(process.cwd(), 'public', 'print-agent', 'agent.js');
      const agentJs     = fs.readFileSync(agentJsPath, 'utf8');

      const lines: string[] = [
        '#!/bin/bash',
        'set -e',
        'DIR="/opt/gm-print-agent"',
        'SVC="/etc/systemd/system/gm-print-agent.service"',
        'echo "=== Gentong Mas Print Agent Setup v1.3 ==="',
        '',
        'NODE=""',
        'for p in /usr/bin/node /usr/local/bin/node /usr/bin/nodejs; do',
        '  [ -x "$p" ] && NODE="$p" && break',
        'done',
        'if [ -z "$NODE" ]; then',
        '  echo "Install Node.js..."',
        '  apt-get update -qq && apt-get install -y nodejs',
        '  NODE=$(which node 2>/dev/null || which nodejs 2>/dev/null)',
        'fi',
        'echo "Node: $NODE ($($NODE --version))"',
        '',
        'command -v lp >/dev/null 2>&1 || apt-get install -y cups cups-client',
        'systemctl is-active cups >/dev/null 2>&1 || systemctl start cups',
        'systemctl enable cups >/dev/null 2>&1',
        'echo "CUPS: OK"',
        '',
        'mkdir -p "$DIR"',
        '',
        "cat > \"$DIR/agent.js\" << 'EOF_AGENT'",
        agentJs.trimEnd(),
        'EOF_AGENT',
        '',
        '"$NODE" --check "$DIR/agent.js" && echo "Syntax OK" || { echo "ERROR syntax"; exit 1; }',
        '',
        'systemctl stop gm-print-agent 2>/dev/null || true',
        '',
        'cat > "$SVC" << EOF_SVC',
        '[Unit]',
        'Description=Gentong Mas ERP Print Agent',
        'After=network.target cups.service',
        '',
        '[Service]',
        'Type=simple',
        'User=root',
        'WorkingDirectory=$DIR',
        'ExecStart=$NODE $DIR/agent.js',
        'Restart=always',
        'RestartSec=5',
        'Environment=AGENT_PORT=6631',
        'StandardOutput=journal',
        'StandardError=journal',
        '',
        '[Install]',
        'WantedBy=multi-user.target',
        'EOF_SVC',
        '',
        'systemctl daemon-reload',
        'systemctl enable gm-print-agent',
        'systemctl start gm-print-agent',
        'sleep 2',
        '',
        'if systemctl is-active --quiet gm-print-agent; then',
        "  IP=$(hostname -I | awk '{print $1}')",
        '  echo ""',
        '  echo "=== BERHASIL! ==="',
        '  echo "URL  : http://$IP:6631"',
        '  echo "Test : curl http://$IP:6631/status"',
        'else',
        '  echo "=== GAGAL ==="',
        '  journalctl -u gm-print-agent -n 20 --no-pager',
        '  exit 1',
        'fi',
      ];

      return new NextResponse(lines.join('\n') + '\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    } catch (err: any) {
      return new NextResponse('echo "ERROR: ' + (err?.message ?? err) + '"', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  }

  // Default: cek status agent
  try {
    const res  = await fetch(`${agentUrl}/status`, { signal: AbortSignal.timeout(4000) });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ online: res.ok, agentUrl, ...data });
  } catch (e: any) {
    return NextResponse.json({ online: false, agentUrl, error: e?.message ?? 'timeout' });
  }
}
