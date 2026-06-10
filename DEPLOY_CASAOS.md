# Panduan Deploy Gentong Mas ERP ke CasaOS

## Prasyarat

- CasaOS sudah terinstall di server/PC/NAS
- Docker dan Docker Compose sudah aktif (bawaan CasaOS)
- Git sudah terinstall di server CasaOS

---

## Langkah Deploy

### 1. Clone proyek ke server CasaOS

```bash
git clone <URL_REPO_KAMU> /DATA/AppData/gentong-mas-erp
cd /DATA/AppData/gentong-mas-erp
```

### 2. Buat file `.env`

```bash
cp .env.example .env
nano .env
```

Isi nilai-nilai berikut:

```env
# IP server CasaOS kamu di jaringan lokal
SERVER_IP=192.168.1.xxx   # ganti dengan IP server kamu

# JWT Secrets (WAJIB diganti!)
JWT_SECRET=xxxxxxxxxxxxx   # generate: openssl rand -base64 64
JWT_REFRESH_SECRET=xxxxxxx # generate: openssl rand -base64 64

# Password database (opsional, bisa dibiarkan default)
POSTGRES_PASSWORD=erp_password_aman
```

Untuk tahu IP server:
```bash
ip addr show | grep "inet 192"
```

### 3. Build dan jalankan semua service

```bash
docker compose up -d --build
```

Build pertama kali akan memakan waktu ~10–20 menit tergantung koneksi dan spesifikasi server.

### 4. Inisialisasi database (hanya pertama kali)

```bash
docker compose exec backend npx prisma migrate deploy --schema=/app/apps/backend/prisma/schema.prisma
```

---

## Akses Aplikasi

Setelah semua container berjalan, akses via browser di jaringan lokal:

| Aplikasi | URL | Keterangan |
|---|---|---|
| **Admin (Web)** | `http://SERVER_IP:5000` | Dashboard utama owner/admin |
| **POS Kasir** | `http://SERVER_IP:3001` | Point of Sale |
| **Sales App** | `http://SERVER_IP:3002` | Aplikasi tim sales |
| **Gudang App** | `http://SERVER_IP:3003` | Manajemen gudang |
| **Driver App** | `http://SERVER_IP:4000` | Aplikasi pengemudi |
| **API Docs** | `http://SERVER_IP:6000/docs` | Swagger dokumentasi API |

Ganti `SERVER_IP` dengan IP server CasaOS kamu.

---

## Perintah Berguna

```bash
# Cek status semua container
docker compose ps

# Lihat log backend
docker compose logs -f backend

# Restart service tertentu
docker compose restart web

# Stop semua
docker compose down

# Update setelah pull kode baru
git pull && docker compose up -d --build
```

---

## Troubleshooting

### Browser tidak bisa akses app
- Pastikan `SERVER_IP` di `.env` sudah benar (IP jaringan lokal, bukan `localhost`)
- Cek firewall: port 3001, 3002, 3003, 5000, 6000 harus terbuka

### Error CORS
- Tambahkan IP/domain kamu di `.env`: `CORS_ORIGINS=http://IP_KAMU:5000`
- Restart backend: `docker compose restart backend`

### Database tidak bisa connect
- Tunggu sampai healthcheck postgres lulus: `docker compose ps`
- Cek log: `docker compose logs postgres`
