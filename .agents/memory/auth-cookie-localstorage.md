---
name: Auth cookie vs localStorage
description: Middleware Next.js baca erp_token dari cookie, tapi auth store hanya simpan ke localStorage — menyebabkan infinite redirect loop.
---

## Rule
Setiap kali token disimpan ke localStorage, JUGA harus set cookie via `document.cookie`. Middleware hanya bisa baca cookie (server-side), tidak bisa baca localStorage.

**Why:** `middleware.ts` membaca `req.cookies.get('erp_token')` — ini server-side. localStorage tidak tersedia di server. Sehingga middleware selalu menganggap user belum login, dan redirect ke `/login`. Login page lalu redirect balik ke `/` — infinite loop — terlihat sebagai white page.

**How to apply:**
- `login()` → setelah dapat accessToken, panggil `setAuthCookies(token, roles)`
- `loginDemo()` → panggil `setAuthCookies(DEMO_TOKEN, DEMO_USER.roles)`
- `logout()` → panggil `clearAuthCookies()`
- `rehydrate()` → jika ada token di localStorage, set cookie ulang (karena cookie bisa expire atau belum ada)
- `loadProfile()` → setelah dapat user data, update roles cookie
- Tambah `/` ke `PUBLIC_PATHS` di `middleware.ts` sebagai safety net (page.tsx menangani proteksi client-side)
