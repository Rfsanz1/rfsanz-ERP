# Gentong Mas ERP

Sistem ERP terpadu — NestJS backend, PostgreSQL database, dan Next.js frontend dengan role-based access control.

## Arsitektur

```
apps/
├── backend/   → NestJS + Prisma + PostgreSQL (port 8000)
├── frontend/  → Next.js 14.2.30 + Tailwind + MUI (port 5000)
│   ├── /           → Launcher (auto-redirect by role)
│   ├── /dashboard  → Owner & Admin
│   ├── /sales      → Tim Sales (sidebar ungu)
│   ├── /gudang     → Warehouse/Gudang (sidebar amber)
│   ├── /driver     → Driver/Delivery (mobile bottom nav)
│   └── /...        → Accounting, HR, Payroll, CRM, dst.
```

## Cara Menjalankan

Dua workflow berjalan otomatis:
- **Start application** — Frontend ERP di port 5000 (`apps/frontend`)
- **Backend API** — NestJS di port 6000 (`apps/backend`)

## Login Default

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |

## Role-Based Access

Login otomatis redirect ke halaman yang sesuai:

| Role | Redirect |
|------|----------|
| Admin / Owner | `/` (Launcher) |
| Sales | `/sales` |
| Gudang / Warehouse | `/gudang` |
| Driver | `/driver` |

Administrator dapat mengatur akses tiap user melalui menu **Settings → Users & Roles**.

## Catatan Penting

- Next.js 14.2.5 diblokir package firewall Replit → gunakan **next@14.2.30**
- Jalankan `prisma generate` jika ada perubahan schema (via `pnpm --filter @erp-modern/backend exec prisma generate`)
- Jalankan `prisma db push` untuk sinkronisasi schema ke database

## User Preferences

- Bahasa Indonesia untuk komunikasi
