#!/bin/sh
# ============================================================
# Jalankan script ini SEKALI dari folder apps/backend:
#   cd apps/backend
#   chmod +x setup-git.sh
#   ./setup-git.sh https://github.com/USERNAME/REPO_NAME.git
# ============================================================

set -e

REMOTE_URL="$1"

if [ -z "$REMOTE_URL" ]; then
  echo ""
  echo "❌  Harap berikan URL repo GitHub kamu!"
  echo "    Contoh: ./setup-git.sh https://github.com/johndoe/gentong-mas-backend.git"
  echo ""
  exit 1
fi

echo ""
echo "🚀  Menyiapkan Git repo standalone untuk backend..."
echo ""

# 1. Init git baru di folder ini
git init

# 2. Set identitas git (sesuaikan jika perlu)
git config user.email "deploy@gentong-mas.local"
git config user.name "Gentong Mas Deploy"

# 3. Tambahkan semua file (node_modules dikecualikan via .gitignore)
git add .

# 4. Commit pertama
git commit -m "feat: initial backend — NestJS + Prisma + Fleetbase adapter + CasaOS docker-compose"

# 5. Ganti nama branch ke main
git branch -M main

# 6. Hubungkan ke GitHub
git remote add origin "$REMOTE_URL"

# 7. Push!
git push -u origin main

echo ""
echo "✅  Berhasil! Backend sudah di-push ke:"
echo "    $REMOTE_URL"
echo ""
echo "📦  Selanjutnya, deploy ke CasaOS:"
echo "    ssh user@IP_CASAOS"
echo "    git clone $REMOTE_URL"
echo "    cd \$(basename $REMOTE_URL .git)"
echo "    cp .env.docker .env && nano .env"
echo "    docker compose up -d --build"
echo ""
