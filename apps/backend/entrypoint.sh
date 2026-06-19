#!/bin/sh
set -e

echo "================================================="
echo "  Gentong Mas ERP — Backend Startup"
echo "================================================="

PRISMA_BIN="./node_modules/.bin/prisma"
SCHEMA="./prisma/schema.prisma"

echo "[1/2] Menjalankan database sync (prisma db push)..."
if [ -f "$PRISMA_BIN" ]; then
  "$PRISMA_BIN" db push --schema="$SCHEMA" --skip-generate \
    && echo "Database sync selesai." \
    || echo "WARN: db push gagal, melanjutkan startup..."
else
  echo "WARN: Prisma binary tidak ditemukan, melewati db push..."
fi

echo "[2/2] Memulai backend server di port ${PORT:-3000}..."
exec node dist/main.js
