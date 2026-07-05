#!/bin/bash
# Gentong Mas ERP — Install Print Agent sebagai systemd service
# Jalankan dengan: sudo bash install-service.sh

set -e

AGENT_DIR="/opt/gm-print-agent"
SERVICE_FILE="/etc/systemd/system/gm-print-agent.service"
NODE_BIN=$(which node 2>/dev/null || which nodejs 2>/dev/null)

echo "╔══════════════════════════════════════════╗"
echo "║  Gentong Mas ERP — Print Agent Installer ║"
echo "╚══════════════════════════════════════════╝"

# Cek Node.js
if [ -z "$NODE_BIN" ]; then
  echo "⚠️  Node.js tidak ditemukan. Menginstall..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  NODE_BIN=$(which node)
fi

echo "✅ Node.js: $(node --version)"

# Cek CUPS
if ! command -v lp &> /dev/null; then
  echo "⚠️  CUPS tidak ditemukan. Menginstall..."
  apt-get install -y cups cups-client
fi
echo "✅ CUPS: $(lp --version 2>/dev/null || echo 'ok')"

# Buat direktori agent
mkdir -p "$AGENT_DIR"
cp agent.js "$AGENT_DIR/agent.js"
echo "✅ Agent disalin ke $AGENT_DIR"

# Buat systemd service
cat > "$SERVICE_FILE" << EOF
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

echo "✅ Service file dibuat: $SERVICE_FILE"

# Aktifkan service
systemctl daemon-reload
systemctl enable gm-print-agent
systemctl start gm-print-agent

sleep 2

if systemctl is-active --quiet gm-print-agent; then
  echo ""
  echo "✅ Print Agent berhasil diinstall dan berjalan!"
  echo ""
  echo "📡 URL Agent: http://$(hostname -I | awk '{print $1}'):6631"
  echo ""
  echo "Perintah berguna:"
  echo "  sudo systemctl status gm-print-agent   → cek status"
  echo "  sudo systemctl restart gm-print-agent  → restart"
  echo "  sudo journalctl -u gm-print-agent -f   → lihat log"
else
  echo "❌ Service gagal start. Cek log:"
  systemctl status gm-print-agent
fi
