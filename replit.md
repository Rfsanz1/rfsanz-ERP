# Gentong Mas ERP — Frontend

Next.js frontend untuk sistem ERP Gentong Mas. Backend berjalan secara terpisah (di-deploy ke CasaOS atau server lain).

## Arsitektur

```
apps/
└── frontend/  → Next.js 14.2.30 + Tailwind + MUI (port 5000)
    ├── /           → Launcher (auto-redirect by role)
    ├── /dashboard  → Owner & Admin
    ├── /sales      → Tim Sales (sidebar ungu)
    ├── /gudang     → Warehouse/Gudang (sidebar amber)
    ├── /driver     → Driver/Delivery (mobile bottom nav)
    └── /...        → Accounting, HR, Payroll, CRM, dst.
```

## Cara Menjalankan

Satu workflow berjalan otomatis:
- **Start application** — Frontend ERP di port 5000 (`apps/frontend`)

## Konfigurasi Backend

Set environment variable `BACKEND_URL` ke URL backend yang sudah di-deploy:

```
BACKEND_URL = https://url-backend-kamu.com
```

Semua request dari frontend ke `/api/*` otomatis di-proxy ke `BACKEND_URL/api/*`.

## Login Default

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |

## Role-Based Access

| Role | Redirect |
|------|----------|
| Admin / Owner | `/` (Launcher) |
| Sales | `/sales` |
| Gudang / Warehouse | `/gudang` |
| Driver | `/driver` |

## Catatan Penting

- Next.js 14.2.5 diblokir package firewall Replit → gunakan **next@14.2.30**
- Backend terpisah — lihat repo `gentong-mas-backend` untuk deploy backend

## User Preferences

- Bahasa Indonesia untuk komunikasi
