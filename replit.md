# Gentong Mas ERP

Sistem ERP terpadu — NestJS backend, PostgreSQL database, dan Next.js frontend dengan role-based access control.

## Arsitektur

```
apps/
├── backend/   → NestJS + Prisma + PostgreSQL (port 6000)
├── frontend/  → Next.js 14.2.30 + Tailwind + MUI (port 5000)
│   ├── /           → Launcher (auto-redirect by role)
│   ├── /dashboard  → Owner & Admin
│   ├── /sales      → Tim Sales (sidebar ungu)
│   ├── /gudang     → Warehouse/Gudang (sidebar amber)
│   ├── /driver     → Driver/Delivery (mobile bottom nav)
│   └── /...        → Accounting, HR, Payroll, CRM, dst.
└── pos-app/   → Kasir (Replit project terpisah)
```

## Cara Menjalankan

Dua workflow berjalan otomatis:
- **Start application** — Frontend ERP di port 5000 (`apps/frontend`)
- **Backend API** — NestJS di port 6000 (`apps/backend`)

## Login Default

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |
| Kasir (POS) | `kasir1` | `kasir123` |

## Role-Based Access

Login otomatis redirect ke halaman yang sesuai:

| Role | Redirect |
|------|----------|
| Admin / Owner | `/` (Launcher) |
| Sales | `/sales` |
| Gudang / Warehouse | `/gudang` |
| Driver | `/driver` |

Administrator dapat mengatur akses tiap user melalui menu **Settings → Users & Roles**.

## POS App (Repo Terpisah)

Folder `apps/pos-app/` adalah aplikasi kasir mandiri yang bisa dipindah ke Replit project baru.
Lihat `apps/pos-app/README.md` untuk panduan setup lengkap.

## Catatan Penting

- Next.js 14.2.5 diblokir package firewall Replit → gunakan **next@14.2.30**
- Jalankan `prisma generate` jika ada perubahan schema (via `pnpm --filter @erp-modern/backend exec prisma generate`)
- Jalankan `prisma db push` untuk sinkronisasi schema ke database

## User Preferences

- Bahasa Indonesia untuk komunikasi
