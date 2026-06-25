#!/bin/sh
set -e

echo "================================================="
echo "  Gentong Mas ERP — Backend Startup"
echo "================================================="

# Tunggu PostgreSQL benar-benar siap menerima koneksi
echo "[0/2] Menunggu PostgreSQL siap..."
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-erp_user}" -q; do
  echo "  PostgreSQL belum siap, coba lagi dalam 2 detik..."
  sleep 2
done
echo "  PostgreSQL siap!"

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
