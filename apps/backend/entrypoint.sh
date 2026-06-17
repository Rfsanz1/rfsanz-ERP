#!/bin/sh
set -e

PRISMA_BIN="./node_modules/.bin/prisma"
SCHEMA="./prisma/schema.prisma"

echo "==> Menjalankan prisma db push..."
if [ -f "$PRISMA_BIN" ]; then
  "$PRISMA_BIN" db push --schema="$SCHEMA" --accept-data-loss || \
    echo "WARN: prisma db push gagal, melanjutkan startup..."
else
  echo "WARN: Prisma binary tidak ditemukan, melewati db push..."
fi

echo "==> Memulai backend server..."
exec node dist/main.js
