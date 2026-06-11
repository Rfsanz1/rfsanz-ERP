#!/bin/sh
# =====================================================
# Gentong Mas ERP — Script Update
# Jalankan: sh update.sh
# =====================================================

set -e

COMPOSE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$COMPOSE_DIR"

echo ""
echo "================================================="
echo "  Gentong Mas ERP — Update"
echo "================================================="
echo ""

# 1. Pull kode terbaru
echo "[1/3] Mengambil update terbaru dari Git..."
git pull
echo ""

# 2. Rebuild image yang berubah dan restart container
echo "[2/3] Rebuild & restart container..."
docker compose up -d --build
echo ""

# 3. Hapus image lama yang tidak terpakai
echo "[3/3] Membersihkan image lama..."
docker image prune -f
echo ""

echo "================================================="
echo "  Update selesai!"
echo ""
echo "  Frontend : http://$(hostname -I | awk '{print $1}'):3000"
echo "  Backend  : http://$(hostname -I | awk '{print $1}'):8000/docs"
echo "================================================="
echo ""
