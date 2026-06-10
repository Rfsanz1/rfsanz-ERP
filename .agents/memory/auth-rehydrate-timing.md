---
name: Auth rehydrate timing fix
description: Kenapa 100+ halaman redirect ke dashboard padahal user sudah login, dan solusinya.
---

## Masalah
Semua halaman punya pola: `useEffect(() => { if (!token) router.push('/dashboard'); }, [token])`.
`ConditionalLayout` memanggil `rehydrate()` di `useEffect` — yang berjalan SETELAH render pertama.
Akibatnya, pada render pertama `token === null` → semua halaman langsung redirect ke dashboard.

## Fix
Pindahkan `rehydrate()` ke `useState` lazy initializer di `ConditionalLayout`:

```js
useState(() => {
  if (typeof window !== 'undefined') {
    useAuthStore.getState().rehydrate();
  }
});
```

`useState` initializer berjalan sinkron pada render pertama komponen — SEBELUM komponen anak dirender.
Karena `ConditionalLayout` adalah wrapper semua halaman, token sudah ada di Zustand store
saat halaman anak pertama kali render. Satu fix → perbaiki 100+ halaman sekaligus.

**Why:** Zustand store bersifat client-only. Pada fresh page load, store kosong sampai `rehydrate()` dipanggil.
Jika dipanggil async (useEffect), ada jeda dimana token masih null dan halaman anak sudah render.

**How to apply:** Jika ada halaman baru dengan auth guard, tidak perlu logic rehydrate sendiri —
cukup `useEffect(() => { if (!token) router.push('/dashboard'); }, [token])` saja, karena
ConditionalLayout sudah menjamin token sudah ada sebelum render.
