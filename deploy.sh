#!/bin/bash
# =====================================================
# Gentong Mas ERP — Auto Deploy Script untuk AA Panel
# Jalankan: bash deploy.sh
# =====================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "================================================="
echo "   Gentong Mas ERP — Auto Deploy"
echo "================================================="
echo -e "${NC}"

# Cek Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}[ERROR] Docker tidak ditemukan! Install Docker dulu.${NC}"
  exit 1
fi

if ! command -v docker compose &> /dev/null 2>&1 && ! docker compose version &> /dev/null 2>&1; then
  echo -e "${RED}[ERROR] Docker Compose tidak ditemukan!${NC}"
  exit 1
fi

echo -e "${GREEN}[✓] Docker ditemukan${NC}"

# Cek file .env
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}[!] File .env tidak ditemukan, membuat dari .env.example...${NC}"
  cp .env.example .env
  echo -e "${RED}[PENTING] Edit file .env terlebih dahulu sebelum lanjut!${NC}"
  echo -e "Jalankan: ${YELLOW}nano .env${NC}"
  exit 1
fi

echo -e "${GREEN}[✓] File .env ditemukan${NC}"

# Stop container lama jika ada
echo -e "${BLUE}[1/4] Menghentikan container lama (jika ada)...${NC}"
docker compose down --remove-orphans 2>/dev/null || true

# Build & jalankan
echo -e "${BLUE}[2/4] Build dan jalankan container (bisa 5-15 menit pertama kali)...${NC}"
docker compose up -d --build

# Tunggu semua container siap
echo -e "${BLUE}[3/4] Menunggu semua service siap...${NC}"
sleep 10

# Cek status
echo -e "${BLUE}[4/4] Cek status container...${NC}"
docker compose ps

echo ""
echo -e "${GREEN}================================================="
echo "   Deploy Selesai!"
echo "=================================================${NC}"
echo ""
echo -e "Frontend  : ${YELLOW}http://$(hostname -I | awk '{print $1}'):5000${NC}"
echo -e "Backend   : ${YELLOW}http://$(hostname -I | awk '{print $1}'):3000${NC}"
echo -e "Swagger   : ${YELLOW}http://$(hostname -I | awk '{print $1}'):3000/docs-swagger${NC}"
echo ""
echo -e "Login default:"
echo -e "  Email   : ${YELLOW}admin@rfsanz.com${NC}"
echo -e "  Password: ${YELLOW}root${NC}"
echo ""
echo -e "${BLUE}Untuk lihat log: docker compose logs -f${NC}"
