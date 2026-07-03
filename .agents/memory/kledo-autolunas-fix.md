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

**Why:** Kledo API untuk invoice payment menggunakan `pay_from: [{id, amount}]` sebagai format utama, bukan items array.

**How to apply:** Semua fix ada di: `kledoSync.ts`, `kledo.service.ts`, `localDb.ts` (ensureTables), `sales/orders/route.ts`, `sales/orders/kledo-retry/route.ts`, `sales/invoices/route.ts`.
