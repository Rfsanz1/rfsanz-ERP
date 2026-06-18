# Panduan Deploy Gentong Mas ERP ke CasaOS

## Prasyarat

- CasaOS sudah terinstall di server/PC/NAS
- Docker dan Docker Compose sudah aktif (bawaan CasaOS)
- Git sudah terinstall di server CasaOS
- Minimal RAM: 2 GB, CPU: 2 core

---

## Langkah Deploy Pertama Kali

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

Isi nilai berikut (wajib):

```env
# IP server CasaOS kamu di jaringan lokal
# Cek dengan: ip addr show | grep "inet 192"
SERVER_IP=192.168.1.xxx

# JWT Secrets — WAJIB DIGANTI!
# Generate: openssl rand -base64 64
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxx
JWT_REFRESH_SECRET=xxxxxxxxxxxxxxxxxxxxxx

# Password database
POSTGRES_PASSWORD=erp_password_aman

# Kredensial admin (sesuaikan jika mau)
ADMIN_EMAIL=admin@rfsanz.com
ADMIN_PASSWORD=root
COMPANY_NAME=Gentong Mas
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

Setelah semua container berjalan:

| Aplikasi          | URL                                        | Keterangan               |
|-------------------|--------------------------------------------|--------------------------|
| **Web Admin**     | `http://SERVER_IP:5000`                    | Dashboard utama ERP      |
| **API Docs**      | `http://SERVER_IP:3000/docs-swagger`       | Swagger dokumentasi API  |
| **Health Check**  | `http://SERVER_IP:3000/api/health`         | Cek status backend       |

Ganti `SERVER_IP` dengan IP server CasaOS kamu.

---

## Update Otomatis (setelah git pull)

Setiap kali ada kode baru, jalankan script update:

```bash
# Cara 1: Pull + update sekaligus (paling mudah)
sh update.sh

# Cara 2: Pull manual dulu, lalu update
git pull
SKIP_PULL=1 sh update.sh
```

Script `update.sh` otomatis:
1. Pull kode terbaru dari Git
2. Rebuild Docker image yang berubah
3. Restart container dengan versi baru
4. Bersihkan image lama
5. Tampilkan status dan URL akses

---

## Perintah Berguna

```bash
# Cek status semua container
docker compose ps

# Lihat log backend (real-time)
docker compose logs -f backend

# Lihat log frontend
docker compose logs -f frontend

# Lihat log database
docker compose logs -f postgres

# Restart service tertentu
docker compose restart backend
docker compose restart frontend

# Stop semua (data tetap aman)
docker compose down

# Reset database TOTAL (HATI-HATI: hapus semua data!)
docker compose down -v
docker compose up -d --build
```

---

## Troubleshooting

### Container backend tidak `healthy`
- Tunggu ~30 detik untuk startup pertama
- Cek log: `docker compose logs backend`
- Pastikan `JWT_SECRET` dan `JWT_REFRESH_SECRET` sudah diisi di `.env`

### Browser tidak bisa akses app
- Pastikan `SERVER_IP` di `.env` sudah benar (IP jaringan lokal, bukan `localhost`)
- Cek firewall: port `5000` dan `3000` harus terbuka
- Jalankan `docker compose ps` — pastikan status `healthy`

### Error CORS
- Tambahkan IP/domain di `.env`: `CORS_ORIGINS=http://IP_KAMU:5000`
- Restart backend: `docker compose restart backend`

### Database tidak bisa connect
- Tunggu healthcheck postgres lulus: `docker compose ps`
- Cek log: `docker compose logs postgres`
- Reset jika perlu: `docker compose down -v && docker compose up -d --build`

### Frontend tidak bisa akses API
- Backend berjalan di container `backend` dengan hostname internal `backend:3000`
- Frontend sudah dikonfigurasi otomatis untuk terhubung ke backend via Docker network
- Rebuild jika ada perubahan env: `SKIP_PULL=1 sh update.sh`
