# 🏠 Deploy Gentong Mas ERP ke CasaOS

## Prasyarat
- CasaOS sudah terinstall di server/mini-PC kamu
- Docker & Docker Compose sudah tersedia (CasaOS sudah include Docker)
- Koneksi ke server via SSH atau terminal langsung

---

## Langkah 1 — Copy Project ke Server

### Opsi A: Clone dari Git
```bash
git clone <repo-url> /DATA/AppData/gentong-mas-erp
cd /DATA/AppData/gentong-mas-erp
```

### Opsi B: Upload via SCP/SFTP
```bash
# Dari komputer lokal kamu:
scp -r ./gentong-mas-erp user@<IP_CASAOS>:/DATA/AppData/gentong-mas-erp
```

---

## Langkah 2 — Buat File `.env`

```bash
cd /DATA/AppData/gentong-mas-erp
cp .env.example .env
nano .env
```

Isi nilai berikut dengan benar:

```env
# IP server CasaOS kamu di jaringan lokal
# Cek dengan: ip addr show | grep "inet 192"
SERVER_IP=192.168.1.xxx

# Port yang bisa diakses dari browser
FRONTEND_PORT=5000
BACKEND_PORT=3000

# Password database (ganti yang aman!)
POSTGRES_PASSWORD=password_aman_kamu

# JWT Secret — WAJIB DIGANTI!
# Generate dengan: openssl rand -base64 64
JWT_SECRET=isi-dengan-random-string-panjang
JWT_REFRESH_SECRET=isi-dengan-random-string-berbeda

# Akun admin default
ADMIN_EMAIL=admin@perusahaan.com
ADMIN_PASSWORD=password_admin_kamu
ADMIN_NAME=Administrator

# Nama perusahaan
COMPANY_NAME=Gentong Mas
```

> ⚠️ **PENTING**: Jangan gunakan JWT_SECRET default! Generate dengan:
> ```bash
> openssl rand -base64 64
> ```

---

## Langkah 3 — Build & Jalankan

```bash
cd /DATA/AppData/gentong-mas-erp

docker compose -f docker-compose.casaos.yml up -d --build
```

> Proses build pertama kali akan memakan waktu **5–15 menit** tergantung spesifikasi server.

### Pantau progress build:
```bash
docker compose -f docker-compose.casaos.yml logs -f
```

---

## Langkah 4 — Cek Status

```bash
docker compose -f docker-compose.casaos.yml ps
```

Semua service harus berstatus `healthy` atau `running`:

```
NAME                     STATUS
gentong-mas-db           Up (healthy)
gentong-mas-backend      Up (healthy)
gentong-mas-frontend     Up
```

---

## Langkah 5 — Akses Aplikasi

Buka browser dan kunjungi:

```
http://<SERVER_IP>:5000
```

Login dengan akun admin yang kamu set di `.env`.

API Backend tersedia di:
```
http://<SERVER_IP>:3000/api
http://<SERVER_IP>:3000/docs-swagger   ← Swagger UI
```

---

## Tambahkan ke CasaOS Dashboard (Opsional)

1. Buka CasaOS Web UI di `http://<SERVER_IP>`
2. Klik **"+"** → **Install a customized app**
3. Pilih **"Import docker-compose.yml"**
4. Upload file `docker-compose.casaos.yml`
5. Isi environment variables sesuai `.env` kamu
6. Klik **Install**

Aplikasi akan muncul di dashboard CasaOS dengan ikon dan nama **Gentong Mas ERP**.

---

## Perintah Berguna

```bash
# Stop semua service
docker compose -f docker-compose.casaos.yml down

# Restart semua service
docker compose -f docker-compose.casaos.yml restart

# Update ke versi terbaru (setelah git pull)
docker compose -f docker-compose.casaos.yml up -d --build

# Lihat log backend
docker logs gentong-mas-backend -f

# Lihat log frontend
docker logs gentong-mas-frontend -f

# Backup database
docker exec gentong-mas-db pg_dump -U erp_user erp_db > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i gentong-mas-db psql -U erp_user erp_db < backup.sql
```

---

## Troubleshooting

### Backend tidak healthy?
```bash
docker logs gentong-mas-backend --tail=50
```
Cek apakah `JWT_SECRET` sudah diisi dan database bisa terkoneksi.

### Frontend tidak bisa akses backend?
Pastikan `SERVER_IP` di `.env` sudah benar dan `CORS_ORIGINS` mencakup alamat frontend.

### Port sudah dipakai?
Ganti `FRONTEND_PORT` atau `BACKEND_PORT` di `.env`, lalu jalankan ulang.
