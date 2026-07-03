---
name: Kledo payment account config
description: Fitur konfigurasi akun COA Kledo per metode pembayaran untuk auto-lunas — cara kerja, storage, dan endpoint.
---

## Ringkasan
Auto-lunas Kledo sebelumnya gagal karena keyword search tidak cocok dengan nama akun COA yang sebenarnya di Kledo user. Solusinya: biarkan user memilih sendiri akun COA mana yang dipakai untuk setiap metode pembayaran, simpan ID-nya, dan gunakan langsung.

## Storage
- **Backend (production)**: `AppSetting` dengan key `kledo_payment_{bankKey}_id` (contoh: `kledo_payment_kas_id`, `kledo_payment_bca_id`)
- **Frontend local dev**: `local_settings` table (localDb) dengan key yang sama
- Keys yang dikelola: `kas`, `elektronik`, `bahan_bangunan`, `bca`, `bri`, `mandiri`, `bni`, `bca_edc`, `bri_edc`, `bni_edc`, `transfer`, `edc`

## Bug getSavedPaymentAccountId (FIXED)
Ketika `DATABASE_URL` tersedia (production CasaOS), fungsi ini hanya baca `local_settings` lalu langsung return — tidak pernah sampai ke `AppSetting` (tempat backend/Prisma simpan konfigurasi payment) maupun backend API. Fix: cek `AppSetting` dulu, baru `local_settings`, baru backend API. File: `apps/frontend/lib/kledoSync.ts`.

## Format payload invoicepayments yang benar
Urutan fallback (tiga variasi dicoba berurutan):
1. **`items: [{ finance_id, amount }]`** — format Kledo API v1, PALING BENAR, coba ini dulu
2. `pay_from: [{ id, amount }]` — format lama
3. `items: [{ invoice_id, amount }]` — format alternatif

**Why:** `invoice_id` dan `pay_from` sering gagal di Kledo production. Field yang benar adalah `finance_id` di dalam array `items`. Logging error body lengkap (bukan hanya `.message`) penting untuk debug variasi yang gagal.

## Mapping akun COA user (keyword fallback)
- Transfer BCA → "BCA GIRO" (keyword: `bca giro`)
- Transfer BRI → "BRI EDC" (keyword: `bri edc`)
- Transfer BNI → "BNI" (keyword: `bni`)
- Transfer MANDIRI → "MANDIRI" (keyword: `mandiri`)
- Debit BCA → "BCA EDC" (keyword: `bca edc`)
- Debit BRI → "BRI EDC" (keyword: `bri edc`)
- Debit BNI → "BNI" (keyword: `bni`)
- Cash Elektronik → "KAS ELEKTRONIK" (keyword: `kas elektronik`)
- Cash Bahan Bangunan → "KAS SULAWESI" (keyword: `kas sulawesi`)

## Endpoints
- Backend: `GET/PUT /api/kledo/payment-config` — baca/simpan config ke AppSetting
- Backend: `GET /api/kledo/coa-accounts` — list semua akun COA Kledo (untuk dropdown UI)
- Frontend: `GET/PUT /api/kledo/payment-config` → proxy ke backend dulu, fallback localDb

## UI
Halaman `/integrations/kledo` (Overview tab) — section "Akun Pembayaran — Auto-Lunas Kledo":
- Dropdown per metode: kas, elektronik, bahan_bangunan, bca, bri, mandiri, bni, bca_edc, bri_edc
- Dropdown option diambil dari GET /api/kledo/coa-accounts

**How to apply:** Setelah deploy, user harus ke Integrasi > Kledo > Overview > "Akun Pembayaran", pilih akun COA dari dropdown, klik Simpan. Setelah itu auto-lunas akan gunakan ID yang dipilih langsung tanpa keyword search.
