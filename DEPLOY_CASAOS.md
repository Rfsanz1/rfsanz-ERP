# Panduan Deploy Gentong Mas ERP ke CasaOS

## Prasyarat

- CasaOS sudah terinstall di server/PC/NAS
- Docker dan Docker Compose sudah aktif (bawaan CasaOS)
- Git sudah terinstall di server CasaOS
- Minimal RAM: 2 GB, CPU: 2 core

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

Isi nilai-nilai berikut (wajib):

```env
# IP server CasaOS kamu di jaringan lokal
# Cek dengan: ip addr show | grep "inet 192"
SERVER_IP=192.168.1.xxx

# JWT Secrets — WAJIB diganti!
# Generate: openssl rand -base64 64
JWT_SECRET=xxxxxxxxxxxxx
JWT_REFRESH_SECRET=xxxxxxx

# Password database (opsional, bisa dibiarkan default)
POSTGRES_PASSWORD=erp_password_aman
```

### 3. Build dan jalankan semua service

```bash
docker compose up -d --build
```

> Build pertama kali memakan waktu **10–20 menit** tergantung koneksi dan spesifikasi server.

### 4. Cek status semua container

```bash
docker compose ps
```

Semua service harus berstatus `healthy` atau `running`.

---

## Akses Aplikasi

Setelah semua container berjalan, akses via browser:

| Aplikasi          | URL                           | Keterangan               |
|-------------------|-------------------------------|--------------------------|
| **Web Admin**     | `http://SERVER_IP:5000`       | Dashboard utama ERP      |
| **API Docs**      | `http://SERVER_IP:6000/docs`  | Swagger dokumentasi API  |
| **Health Check**  | `http://SERVER_IP:6000/api/health` | Cek status backend  |

Ganti `SERVER_IP` dengan IP server CasaOS kamu.

---

## Perintah Berguna

```bash
# Cek status semua container
docker compose ps

# Lihat log backend
docker compose logs -f backend

# Lihat log frontend
docker compose logs -f frontend

# Restart service tertentu
docker compose restart frontend

# Stop semua
docker compose down

# Update setelah pull kode baru
git pull && docker compose up -d --build

# Reset database (HATI-HATI: hapus semua data!)
docker compose down -v
docker compose up -d --build
```

---

## Troubleshooting

### Browser tidak bisa akses app
- Pastikan `SERVER_IP` di `.env` sudah benar (IP jaringan lokal, bukan `localhost`)
- Cek firewall: port `5000` dan `6000` harus terbuka
- Jalankan `docker compose ps` — pastikan status `healthy`

### Error CORS
- Tambahkan IP/domain kamu di `.env`: `CORS_ORIGINS=http://IP_KAMU:5000`
- Restart backend: `docker compose restart backend`

### Database tidak bisa connect
- Tunggu sampai healthcheck postgres lulus: `docker compose ps`
- Cek log: `docker compose logs postgres`
- Pastikan volume postgres belum korup: `docker compose down -v && docker compose up -d --build`

### Frontend tidak bisa akses API
- Pastikan `NEXT_PUBLIC_API_URL=http://SERVER_IP:6000` di `.env` sudah benar
- Rebuild frontend setelah ubah env: `docker compose build frontend && docker compose up -d frontend`
