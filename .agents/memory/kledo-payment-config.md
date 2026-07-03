---
name: Kledo payment account config
description: Fitur konfigurasi akun COA Kledo per metode pembayaran untuk auto-lunas — cara kerja, storage, dan endpoint.
---

## Ringkasan
Auto-lunas Kledo sebelumnya gagal karena keyword search (`['kas masuk', 'kas tunai', ...]`) tidak cocok dengan nama akun COA yang sebenarnya di Kledo user. Solusinya: biarkan user memilih sendiri akun COA mana yang dipakai untuk setiap metode pembayaran, simpan ID-nya, dan gunakan langsung.

## Storage
- **Backend (production)**: `AppSetting` dengan key `kledo_payment_{bankKey}_id` (contoh: `kledo_payment_kas_id`, `kledo_payment_bca_id`)
- **Frontend local dev**: `local_settings` table (localDb) dengan key yang sama
- Keys yang dikelola: `kas`, `elektronik`, `bahan_bangunan`, `bca`, `bri`, `mandiri`, `bni`, `bca_edc`, `bri_edc`, `bni_edc`, `transfer`, `edc`

## Endpoints
- Backend: `GET/PUT /api/kledo/payment-config` — baca/simpan config ke AppSetting
- Backend: `GET /api/kledo/coa-accounts` — list semua akun COA Kledo (untuk dropdown UI)
- Frontend proxy: `GET/PUT /api/kledo/payment-config` → proxy ke backend, fallback ke localDb
- Frontend: `GET /api/kledo/coa-accounts` → call Kledo langsung via getKledoCfg

## Alur auto-lunas
1. `getBankAccountId(key)` — cek AppSetting/localDb untuk saved account ID dulu
2. Jika tidak ada saved ID → fallback ke keyword search di COA Kledo
3. Keyword search log semua nama akun (juga di production) untuk debug

## Format payload invoicepayments yang benar
Urutan fallback (tiga variasi dicoba berurutan):
1. **`items: [{ finance_id, amount }]`** — format Kledo API v1, PALING BENAR, coba ini dulu
2. `pay_from: [{ id, amount }]` — format lama
3. `items: [{ invoice_id, amount }]` — format alternatif

**Why:** `invoice_id` dan `pay_from` sering gagal di Kledo production. Field yang benar adalah `finance_id` di dalam array `items`. Logging error body lengkap (bukan hanya `.message`) penting untuk debug variasi yang gagal.

## UI
Halaman `/integrations/kledo` (Overview tab) — section "Akun Pembayaran — Auto-Lunas Kledo":
- Dropdown per metode (9 baris: kas, elektronik, bahan_bangunan, bca, bri, mandiri, bni, bca_edc, bri_edc)
- Dropdown option diambil dari GET /api/kledo/coa-accounts
- Tombol "Simpan" cek response.ok, tampilkan error jika gagal

**How to apply:** Setelah deploy, user harus ke Integrasi > Kledo > Overview > "Akun Pembayaran", pilih akun COA dari dropdown, klik Simpan. Setelah itu auto-lunas akan gunakan ID yang dipilih langsung.
