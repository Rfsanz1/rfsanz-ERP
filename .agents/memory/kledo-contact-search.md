---
name: Kledo contact search param
description: Parameter URL yang benar untuk cari kontak di Kledo API
---

# Kledo Contact Search Parameter

## Rule
Gunakan `?search=<nama>` bukan `?keyword=<nama>` saat query `/finance/contacts`.

**Why:** `?keyword=` di endpoint `/finance/contacts` Kledo tidak memfilter berdasarkan nama — selalu mengembalikan kontak-kontak pertama (halaman 1 default) tanpa mempedulikan keyword. `?search=` bekerja dengan benar dan mengembalikan kontak yang nama-nya mengandung string tersebut.

**How to apply:**
- `findOrCreateKledoContact` di `lib/kledoSync.ts` sudah diperbaiki: search dulu dengan `?search=`, exact match by name, baru create kalau tidak ketemu.
- Strategi: search → jika tidak ada → create → jika gagal karena duplikat → search lagi dengan per_page=200.
- `KLEDO_TOKEN` env var wajib di-set (ada di AppSetting DB key `kledo_token`); jika tidak ada, fallback ke GET /api/settings dari backend.
