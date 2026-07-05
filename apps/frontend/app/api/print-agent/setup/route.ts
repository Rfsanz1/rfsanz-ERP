import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Baca agent.js dari folder public
    const agentPath = path.join(process.cwd(), 'public', 'print-agent', 'agent.js');
    const agentJs = fs.readFileSync(agentPath, 'utf8');

    // Bangun bash script dengan string concat (hindari template literal yang bisa corrupt)
    const lines: string[] = [];
    lines.push('#!/bin/bash');
    lines.push('set -e');
    lines.push('DIR="/opt/gm-print-agent"');
    lines.push('SVC="/etc/systemd/system/gm-print-agent.service"');
    lines.push('echo "=== Gentong Mas Print Agent Setup v1.3 ==="');
    lines.push('');
    lines.push('# Cari Node.js');
    lines.push('NODE=""');
    lines.push('for p in /usr/bin/node /usr/local/bin/node /usr/bin/nodejs; do');
    lines.push('  [ -x "$p" ] && NODE="$p" && break');
    lines.push('done');
    lines.push('if [ -z "$NODE" ]; then');
    lines.push('  echo "Install Node.js..."');
    lines.push('  apt-get update -qq && apt-get install -y nodejs');
    lines.push('  NODE=$(which node 2>/dev/null || which nodejs 2>/dev/null)');
    lines.push('fi');
    lines.push('echo "Node: $NODE ($($NODE --version))"');
    lines.push('');
    lines.push('# Cek CUPS');
    lines.push('command -v lp >/dev/null 2>&1 || apt-get install -y cups cups-client');
    lines.push('systemctl is-active cups >/dev/null 2>&1 || systemctl start cups');
    lines.push('systemctl enable cups >/dev/null 2>&1');
    lines.push('echo "CUPS: OK"');
    lines.push('');
    lines.push('mkdir -p "$DIR"');
    lines.push('');
    lines.push('# Tulis agent.js');
    lines.push("cat > \"$DIR/agent.js\" << 'EOF_AGENT'");
    lines.push(agentJs.trimEnd());
    lines.push('EOF_AGENT');
    lines.push('');
    lines.push('# Verify syntax');
    lines.push('"$NODE" --check "$DIR/agent.js" && echo "Syntax OK" || { echo "ERROR: syntax salah"; exit 1; }');
    lines.push('');
    lines.push('# Stop service lama');
    lines.push('systemctl stop gm-print-agent 2>/dev/null || true');
    lines.push('');
    lines.push('# Tulis service');
    lines.push('cat > "$SVC" << EOF_SVC');
    lines.push('[Unit]');
    lines.push('Description=Gentong Mas ERP Print Agent');
    lines.push('After=network.target cups.service');
    lines.push('');
    lines.push('[Service]');
    lines.push('Type=simple');
    lines.push('User=root');
    lines.push('WorkingDirectory=$DIR');
    lines.push('ExecStart=$NODE $DIR/agent.js');
    lines.push('Restart=always');
    lines.push('RestartSec=5');
    lines.push('Environment=AGENT_PORT=6631');
    lines.push('StandardOutput=journal');
    lines.push('StandardError=journal');
    lines.push('');
    lines.push('[Install]');
    lines.push('WantedBy=multi-user.target');
    lines.push('EOF_SVC');
    lines.push('');
    lines.push('systemctl daemon-reload');
    lines.push('systemctl enable gm-print-agent');
    lines.push('systemctl start gm-print-agent');
    lines.push('sleep 2');
    lines.push('');
    lines.push('if systemctl is-active --quiet gm-print-agent; then');
    lines.push('  IP=$(hostname -I | awk \'{print $1}\')');
    lines.push('  echo ""');
    lines.push('  echo "=== BERHASIL! ==="');
    lines.push('  echo "URL  : http://$IP:6631"');
    lines.push('  echo "Test : curl http://$IP:6631/status"');
    lines.push('else');
    lines.push('  echo "=== GAGAL ==="');
    lines.push('  journalctl -u gm-print-agent -n 20 --no-pager');
    lines.push('  exit 1');
    lines.push('fi');

    const script = lines.join('\n') + '\n';

    return new NextResponse(script, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new NextResponse('echo "ERROR: ' + msg + '"', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
