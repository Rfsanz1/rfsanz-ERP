#!/bin/sh
# =====================================================
# Gentong Mas ERP — Script Auto Update
# Jalankan setelah git pull: sh update.sh
# Atau otomatis: git pull && sh update.sh
# =====================================================

set -e

COMPOSE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$COMPOSE_DIR"

SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost')"

echo ""
echo "================================================="
echo "  Gentong Mas ERP — Auto Update"
echo "================================================="
echo ""

# 1. Pull kode terbaru (skip jika sudah di-pull manual)
if [ "${SKIP_PULL:-0}" != "1" ]; then
  echo "[1/4] Mengambil update terbaru dari Git..."
  git pull
  echo ""
else
  echo "[1/4] Git pull dilewati (SKIP_PULL=1)"
  echo ""
fi

# 2. Rebuild image yang berubah
echo "[2/4] Rebuild container (hanya yang berubah)..."
docker compose build --parallel
echo ""

# 3. Restart container dengan image baru (zero-downtime bergantian)
echo "[3/4] Restart container dengan versi baru..."
docker compose up -d
echo ""

# 4. Hapus image lama yang tidak terpakai
echo "[4/4] Membersihkan image lama..."
docker image prune -f
echo ""

# Tunggu sebentar lalu cek status
sleep 5
echo "Status container:"
docker compose ps
echo ""

echo "================================================="
echo "  Update selesai!"
echo ""
echo "  Frontend  : http://${SERVER_IP}:${FRONTEND_PORT:-5000}"
echo "  Backend   : http://${SERVER_IP}:${BACKEND_PORT:-3000}/docs-swagger"
echo "  API Health: http://${SERVER_IP}:${BACKEND_PORT:-3000}/api/health"
echo "================================================="
echo ""
