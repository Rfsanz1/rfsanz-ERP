# Gentong Mas — POS App

Aplikasi Point of Sale kasir untuk sistem ERP Gentong Mas. Dijalankan **terpisah** dari aplikasi utama ERP.

## Cara Setup di Replit Project Baru

### 1. Buat Replit project baru
- Buka [replit.com](https://replit.com) → **Create Repl** → pilih template **Node.js**
- Salin seluruh isi folder `apps/pos-app/` ke root project baru tersebut

### 2. Set Environment Variable
Di Replit → **Secrets**, tambahkan:
```
BACKEND_URL = https://URL-BACKEND-KAMU.replit.app
```
> Ganti dengan URL deployed backend dari project utama ERP.

### 3. Konfigurasi Workflow
Di Replit → **Workflows**, set command:
```
npm run dev
```
Port otomatis: **5000**

### 4. Install & Jalankan
```bash
npm install
npm run dev
```

## Login POS

| Akun | Email/Username | Password |
|------|---------------|----------|
| Kasir | `kasir1` | `kasir123` |
| Admin | `admin@example.com` | `admin123` |

## Fitur

- Transaksi penjualan kasir (cart, diskon, voucher)
- Multiple metode pembayaran: tunai, transfer, kartu, QRIS
- Cetak struk
- Manajemen sesi kasir
- Laporan penjualan harian
- Manajemen produk POS

## Environment Variables

| Variable | Keterangan |
|----------|-----------|
| `BACKEND_URL` | URL backend ERP (wajib diisi) |
