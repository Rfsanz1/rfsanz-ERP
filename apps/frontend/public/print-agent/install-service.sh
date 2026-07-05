#!/bin/bash
# Gentong Mas ERP — Install / Update Print Agent sebagai systemd service
# Jalankan: sudo bash install-service.sh

set -e
AGENT_DIR="/opt/gm-print-agent"
SERVICE="/etc/systemd/system/gm-print-agent.service"

echo "╔═══════════════════════════════════════════╗"
echo "║  Gentong Mas ERP - Print Agent Installer  ║"
echo "╚═══════════════════════════════════════════╝"

# ── Cari Node.js ──────────────────────────────────────────────────────────
NODE_BIN=""
for n in /usr/bin/node /usr/local/bin/node /usr/bin/nodejs; do
  if [ -x "$n" ]; then NODE_BIN="$n"; break; fi
done

if [ -z "$NODE_BIN" ]; then
  echo "⚠  Node.js tidak ditemukan. Menginstall..."
  apt-get update -qq
  apt-get install -y nodejs
  NODE_BIN=$(which node 2>/dev/null || which nodejs 2>/dev/null)
fi

echo "✅ Node.js: $NODE_BIN ($($NODE_BIN --version))"

# ── Cek CUPS ──────────────────────────────────────────────────────────────
if ! command -v lp &>/dev/null; then
  echo "⚠  CUPS tidak ditemukan. Menginstall..."
  apt-get install -y cups cups-client
fi
systemctl is-active cups &>/dev/null || systemctl start cups
echo "✅ CUPS: aktif"

# ── Salin agent ───────────────────────────────────────────────────────────
mkdir -p "$AGENT_DIR"
cp "$(dirname "$0")/agent.js" "$AGENT_DIR/agent.js" 2>/dev/null \
  || cp agent.js "$AGENT_DIR/agent.js"
echo "✅ agent.js disalin ke $AGENT_DIR"

# ── Tulis service file ────────────────────────────────────────────────────
cat > "$SERVICE" <<EOF
[Unit]
Description=Gentong Mas ERP Print Agent
After=network.target cups.service
Wants=cups.service

[Service]
Type=simple
User=root
WorkingDirectory=$AGENT_DIR
ExecStart=$NODE_BIN $AGENT_DIR/agent.js
Restart=always
RestartSec=5
Environment=AGENT_PORT=6631
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file: $SERVICE"

# ── Aktifkan & mulai ──────────────────────────────────────────────────────
systemctl daemon-reload
systemctl enable gm-print-agent
systemctl restart gm-print-agent
sleep 2

if systemctl is-active --quiet gm-print-agent; then
  MY_IP=$(hostname -I | awk '{print $1}')
  echo ""
  echo "✅ Print Agent berhasil berjalan!"
  echo "📡 URL Agent : http://$MY_IP:6631"
  echo "🖨  Printer   : $(lpstat -p 2>/dev/null | awk '{print $2}' | tr '\n' ', ' || echo '(cek: lpstat -p)')"
  echo ""
  echo "Perintah berguna:"
  echo "  sudo systemctl status gm-print-agent"
  echo "  sudo journalctl -u gm-print-agent -f"
else
  echo ""
  echo "❌ Gagal start. Lihat error:"
  journalctl -u gm-print-agent -n 20 --no-pager
fi
