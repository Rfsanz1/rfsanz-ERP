#!/bin/bash
# =====================================================================
# Gentong Mas ERP — Management Script
# Jalankan: bash manage.sh
# =====================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

COMPOSE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$COMPOSE_DIR"
SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost')"
FRONTEND_URL="https://gentongmaselektronik.my.id"
BACKEND_URL="https://api.gentongmaselektronik.my.id"

# ── Header ────────────────────────────────────────────────────────────
print_header() {
  echo ""
  echo -e "${BLUE}${BOLD}=================================================${NC}"
  echo -e "${BLUE}${BOLD}   Gentong Mas ERP — Management Script${NC}"
  echo -e "${BLUE}${BOLD}=================================================${NC}"
  echo ""
}

# ── Cek prasyarat ─────────────────────────────────────────────────────
check_requirements() {
  if ! command -v docker &>/dev/null; then
    echo -e "${RED}[ERROR] Docker tidak ditemukan! Install Docker dulu.${NC}"
    exit 1
  fi
  if ! docker compose version &>/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker Compose tidak ditemukan!${NC}"
    exit 1
  fi
}

# ── Tampilkan status container ─────────────────────────────────────────
show_status() {
  echo -e "${CYAN}${BOLD}Status Container:${NC}"
  docker compose ps
  echo ""
  echo -e "${CYAN}${BOLD}Penggunaan Resource:${NC}"
  docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || true
}

# ── Tampilkan info akses ───────────────────────────────────────────────
show_access_info() {
  echo ""
  echo -e "${GREEN}${BOLD}=================================================${NC}"
  echo -e "${GREEN}  Akses Aplikasi:${NC}"
  echo -e "  Frontend  : ${YELLOW}${FRONTEND_URL}${NC}"
  echo -e "  Backend   : ${YELLOW}${BACKEND_URL}${NC}"
  echo -e "  Swagger   : ${YELLOW}${BACKEND_URL}/docs-swagger${NC}"
  echo -e "  Health    : ${YELLOW}${BACKEND_URL}/api/health${NC}"
  echo -e "${GREEN}${BOLD}=================================================${NC}"
  echo ""
}

# ─────────────────────────────────────────────────────────────────────
# MENU 1: Deploy Pertama Kali
# ─────────────────────────────────────────────────────────────────────
action_deploy() {
  echo -e "${BOLD}[DEPLOY] Instalasi pertama kali${NC}"
  echo ""

  # Cek .env
  if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[!] File .env tidak ditemukan, membuat dari .env.example...${NC}"
    if [ -f ".env.example" ]; then
      cp .env.example .env
      echo -e "${RED}[PENTING] Edit file .env dulu sebelum lanjut!${NC}"
      echo -e "Jalankan: ${YELLOW}nano .env${NC}"
      exit 1
    else
      echo -e "${RED}[ERROR] .env.example tidak ditemukan!${NC}"
      exit 1
    fi
  fi

  echo -e "${GREEN}[✓] File .env ditemukan${NC}"
  echo ""

  echo -e "${BLUE}[1/3] Menghentikan container lama (jika ada)...${NC}"
  docker compose down --remove-orphans 2>/dev/null || true
  echo ""

  echo -e "${BLUE}[2/3] Build dan jalankan semua container...${NC}"
  echo -e "      (bisa 5-15 menit untuk build pertama kali)"
  docker compose up -d --build
  echo ""

  echo -e "${BLUE}[3/3] Menunggu semua service siap...${NC}"
  sleep 10
  show_status
  show_access_info
}

# ─────────────────────────────────────────────────────────────────────
# MENU 2: Update (Pull + Rebuild + Restart)
# ─────────────────────────────────────────────────────────────────────
action_update() {
  echo -e "${BOLD}[UPDATE] Mengambil & menerapkan update terbaru${NC}"
  echo ""

  echo -e "${BLUE}[1/4] Git pull...${NC}"
  git pull
  echo ""

  echo -e "${BLUE}[2/4] Rebuild container (hanya yang berubah)...${NC}"
  docker compose build --parallel
  echo ""

  echo -e "${BLUE}[3/4] Restart container dengan image baru...${NC}"
  docker compose up -d
  echo ""

  echo -e "${BLUE}[4/4] Bersihkan image lama...${NC}"
  docker image prune -f
  echo ""

  sleep 5
  show_status
  show_access_info
}

# ─────────────────────────────────────────────────────────────────────
# MENU 3: Manajemen Penyimpanan
# ─────────────────────────────────────────────────────────────────────
action_storage() {
  echo -e "${BOLD}[STORAGE] Manajemen Penyimpanan Docker${NC}"
  echo ""

  # Tampilkan penggunaan sekarang
  echo -e "${CYAN}Penggunaan disk saat ini:${NC}"
  docker system df
  echo ""

  echo -e "Pilih aksi:"
  echo -e "  ${YELLOW}1${NC}) Hapus image yang tidak dipakai (aman)"
  echo -e "  ${YELLOW}2${NC}) Hapus container yang sudah berhenti (aman)"
  echo -e "  ${YELLOW}3${NC}) Hapus build cache (bebaskan ruang besar, build berikutnya lebih lama)"
  echo -e "  ${YELLOW}4${NC}) Bersihkan semua (image + container + cache) — AMAN, data/volume tetap"
  echo -e "  ${YELLOW}5${NC}) RESET TOTAL (hapus data database juga!) — HATI-HATI!"
  echo -e "  ${YELLOW}0${NC}) Kembali ke menu utama"
  echo ""
  read -rp "Pilihan: " storage_choice

  case "$storage_choice" in
    1)
      echo -e "${BLUE}Menghapus image tidak terpakai...${NC}"
      docker image prune -f
      echo -e "${GREEN}Selesai.${NC}"
      ;;
    2)
      echo -e "${BLUE}Menghapus container yang sudah berhenti...${NC}"
      docker container prune -f
      echo -e "${GREEN}Selesai.${NC}"
      ;;
    3)
      echo -e "${BLUE}Menghapus build cache...${NC}"
      docker builder prune -f
      echo -e "${GREEN}Selesai.${NC}"
      ;;
    4)
      echo -e "${BLUE}Membersihkan image + container + cache (data aman)...${NC}"
      docker image prune -af
      docker container prune -f
      docker builder prune -f
      echo -e "${GREEN}Selesai.${NC}"
      ;;
    5)
      echo ""
      echo -e "${RED}${BOLD}⚠ PERINGATAN: Ini akan MENGHAPUS SEMUA DATA DATABASE!${NC}"
      echo -e "${RED}Semua data transaksi, produk, user akan hilang permanen.${NC}"
      read -rp "Ketik 'HAPUS' untuk konfirmasi: " confirm
      if [ "$confirm" = "HAPUS" ]; then
        echo -e "${BLUE}Menghentikan dan menghapus semua container + volume...${NC}"
        docker compose down -v --remove-orphans
        docker image prune -af
        docker builder prune -f
        echo -e "${RED}Reset selesai. Jalankan 'bash manage.sh' → Deploy untuk install ulang.${NC}"
      else
        echo -e "${YELLOW}Dibatalkan.${NC}"
      fi
      ;;
    0)
      return
      ;;
    *)
      echo -e "${RED}Pilihan tidak valid.${NC}"
      ;;
  esac

  echo ""
  echo -e "${CYAN}Penggunaan disk setelah bersih:${NC}"
  docker system df
}

# ─────────────────────────────────────────────────────────────────────
# MENU 4: Log
# ─────────────────────────────────────────────────────────────────────
action_logs() {
  echo -e "${BOLD}[LOGS] Lihat log container${NC}"
  echo ""
  echo -e "Pilih service:"
  echo -e "  ${YELLOW}1${NC}) Backend (NestJS)"
  echo -e "  ${YELLOW}2${NC}) Frontend (Next.js)"
  echo -e "  ${YELLOW}3${NC}) Database (PostgreSQL)"
  echo -e "  ${YELLOW}4${NC}) Semua sekaligus"
  echo -e "  ${YELLOW}0${NC}) Kembali"
  echo ""
  read -rp "Pilihan: " log_choice

  case "$log_choice" in
    1) docker compose logs -f --tail=100 backend ;;
    2) docker compose logs -f --tail=100 frontend ;;
    3) docker compose logs -f --tail=100 postgres ;;
    4) docker compose logs -f --tail=50 ;;
    0) return ;;
    *) echo -e "${RED}Pilihan tidak valid.${NC}" ;;
  esac
}

# ─────────────────────────────────────────────────────────────────────
# MENU 5: Restart / Stop / Start
# ─────────────────────────────────────────────────────────────────────
action_control() {
  echo -e "${BOLD}[KONTROL] Start / Stop / Restart${NC}"
  echo ""
  echo -e "  ${YELLOW}1${NC}) Restart semua"
  echo -e "  ${YELLOW}2${NC}) Restart backend saja"
  echo -e "  ${YELLOW}3${NC}) Restart frontend saja"
  echo -e "  ${YELLOW}4${NC}) Stop semua (data aman)"
  echo -e "  ${YELLOW}5${NC}) Start semua"
  echo -e "  ${YELLOW}0${NC}) Kembali"
  echo ""
  read -rp "Pilihan: " ctrl_choice

  case "$ctrl_choice" in
    1) docker compose restart && show_status ;;
    2) docker compose restart backend && echo -e "${GREEN}Backend di-restart.${NC}" ;;
    3) docker compose restart frontend && echo -e "${GREEN}Frontend di-restart.${NC}" ;;
    4) docker compose stop && echo -e "${YELLOW}Semua container dihentikan.${NC}" ;;
    5) docker compose start && show_status ;;
    0) return ;;
    *) echo -e "${RED}Pilihan tidak valid.${NC}" ;;
  esac
}

# ─────────────────────────────────────────────────────────────────────
# MAIN MENU
# ─────────────────────────────────────────────────────────────────────
check_requirements

while true; do
  print_header
  show_status
  echo ""
  echo -e "${BOLD}Pilih aksi:${NC}"
  echo -e "  ${YELLOW}1${NC}) 🚀  Deploy (instalasi pertama kali)"
  echo -e "  ${YELLOW}2${NC}) 🔄  Update (git pull + rebuild + restart)"
  echo -e "  ${YELLOW}3${NC}) 💾  Manajemen Penyimpanan"
  echo -e "  ${YELLOW}4${NC}) 📋  Lihat Log"
  echo -e "  ${YELLOW}5${NC}) ⚙️   Start / Stop / Restart"
  echo -e "  ${YELLOW}0${NC}) ❌  Keluar"
  echo ""
  read -rp "Pilihan: " choice

  case "$choice" in
    1) action_deploy ;;
    2) action_update ;;
    3) action_storage ;;
    4) action_logs ;;
    5) action_control ;;
    0)
      echo -e "${GREEN}Sampai jumpa!${NC}"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Pilihan tidak valid.${NC}"
      sleep 1
      ;;
  esac

  echo ""
  read -rp "Tekan Enter untuk kembali ke menu..." _
done
