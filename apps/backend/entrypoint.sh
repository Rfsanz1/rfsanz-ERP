#!/bin/sh
set -e

echo "================================================="
echo "  Gentong Mas ERP — Backend Startup"
echo "================================================="

PRISMA_BIN="./node_modules/.bin/prisma"
SCHEMA="./prisma/schema.prisma"

echo "[1/2] Menjalankan database migration..."
if [ -f "$PRISMA_BIN" ]; then
  "$PRISMA_BIN" migrate deploy --schema="$SCHEMA" \
    && echo "Migration selesai." \
    || echo "WARN: migrate deploy gagal, melanjutkan startup..."
else
  echo "WARN: Prisma binary tidak ditemukan, melewati migration..."
fi

echo "[2/2] Memulai backend server di port ${PORT:-3000}..."
exec node dist/main.js
