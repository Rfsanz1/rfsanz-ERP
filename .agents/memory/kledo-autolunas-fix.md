---
name: Kledo auto-lunas fix
description: Root causes dan fix untuk auto-lunas (auto payment settlement) ke Kledo yang gagal
---

## Root causes auto-lunas gagal (semua harus diperbaiki bersamaan)

1. **Payload format salah** — `markKledoInvoicePaid` mencoba `items[].finance_id` pertama (salah), padahal format benar Kledo adalah `pay_from: [{id: invoiceId, amount}]`. Sekarang format benar dicoba pertama.

2. **Amount tidak dibulatkan** — Kledo menolak amount desimal (rupiah harus integer). Tambahkan `Math.round(amount)` sebelum dikirim di semua tempat.

3. **BANK_KEYWORDS terlalu ketat** — `bca` hanya mencari "bca giro"/"giro bca", tidak mencari "bca" biasa. Sekarang tiap bank punya fallback keyword yang lebih luas, berurutan dari spesifik ke generik.

4. **`bank_pilihan`/`edc_pilihan`/`unit_bisnis` tidak disimpan ke DB** — sehingga retry selalu kehilangan info bank. Kolom ditambahkan via migration `ADD COLUMN IF NOT EXISTS` di `ensureTables()`.

5. **`kledo-retry` tidak load `pembayaran_list`/`bank_pilihan` dari DB** — sehingga retry selalu pakai metode generik. Sekarang load semua dari kolom DB.

6. **`edcPilihan`/`unitBisnis` tidak diteruskan ke `pushOrderToKledo`** di `sales/invoices/route.ts` — debit/cash selalu fallback ke akun generik.

7. **`kledoPaid`/`kledoPaidError` hilang di response orders** — sehingga frontend tidak bisa tahu apakah lunas berhasil. Sekarang dikembalikan di response.

**Why:** Endpoint `/finance/invoicepayments` tidak ada (404) di api.kledo.com. Endpoint resmi dari OpenAPI spec Kledo adalah `/finance/bankTrans/invoicePayment`. Field body juga berbeda: `bank_account_id` (bukan `finance_account_id`), `business_tran_id` (bukan `pay_from[].id`). Format yang benar: `{ trans_date, bank_account_id, business_tran_id, amount, memo }`.

**How to apply:** Fix ada di `kledoSync.ts` fungsi `markKledoInvoicePaid`. Base URL tetap `https://api.kledo.com/api/v1`.
