# Gentong Mas ERP

Sistem ERP multi-aplikasi modern — satu backend NestJS, satu database PostgreSQL, 5 aplikasi Next.js terpisah per role.

## Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│              NestJS Backend API  (port 6000)                     │
│  Auth · Sales · Inventory · POS · Fleet · Finance · CRM · HR    │
└──┬──────────┬──────────┬──────────┬──────────┬──────────────────┘
   │          │          │          │          │
┌──▼──┐  ┌───▼──┐  ┌────▼─┐  ┌────▼─┐  ┌────▼──┐
│ Web │  │Sales │  │Gudang│  │ POS  │  │Driver │
│5000 │  │ 3002 │  │ 3003 │  │ 3001 │  │ 3000  │
│Admin│  │ App  │  │ App  │  │ App  │  │  App  │
└─────┘  └──────┘  └──────┘  └──────┘  └───────┘
```

## Daftar Aplikasi

| App | Port | Role | Warna | Deskripsi |
|-----|------|------|-------|-----------|
| `apps/web` | 5000 | ADMIN, OWNER | Blue | Dashboard admin & manajemen utama |
| `apps/sales-app` | 3002 | SALES | Blue | Buat SO, pantau pipeline, customer |
| `apps/gudang-app` | 3003 | GUDANG | Amber | Inbound PO, outbound picking, stok opname |
| `apps/pos-app` | 3001 | KASIR | Emerald | Kasir POS, sesi kasir, laporan harian |
| `apps/driver-app` | 3000 | DRIVER | Slate | Delivery tasks, update status, riwayat |
| `apps/backend` | 6000 | — | — | NestJS + Prisma + PostgreSQL |

## Shared Packages

| Package | Isi |
|---------|-----|
| `packages/types` | `UserRole`, `AuthUser`, `LoginResponse`, `ROLE_APP_MAP` |
| `packages/utils` | `api.ts` (axios instance), `auth.ts` (JWT helpers), `format.ts` |
| `packages/ui` | `Button`, `Table`, `Modal`, `Card`, `Badge`, `AppShell` |

## Flow Data Utama

```
Sales buat SO  →  Admin konfirmasi  →  Gudang picking  →  Driver antar  →  Selesai
   /sales          /admin               /gudang             /driver
  (3002)           (5000)               (3003)              (3000)
```

```
Customer beli  →  Kasir scan  →  Bayar  →  Struk cetak
   (walk-in)       /pos           (3001)
```

## Setup Lokal

### Prasyarat

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+ (atau pakai docker-compose)

### 1. Clone & Install

```bash
pnpm install
```

### 2. Setup Backend

```bash
cp apps/backend/.env.example apps/backend/.env
# Edit DATABASE_URL, JWT_SECRET di apps/backend/.env

cd apps/backend
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed   # opsional: isi data demo
```

### 3. Setup Frontend Apps

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/sales-app/.env.example apps/sales-app/.env.local
cp apps/gudang-app/.env.example apps/gudang-app/.env.local
cp apps/pos-app/.env.example apps/pos-app/.env.local
cp apps/driver-app/.env.example apps/driver-app/.env.local
```

### 4. Jalankan Dev

```bash
# Backend
cd apps/backend && pnpm start:dev

# Setiap app (terminal terpisah)
cd apps/web && pnpm dev          # http://localhost:5000
cd apps/sales-app && pnpm dev    # http://localhost:3002
cd apps/gudang-app && pnpm dev   # http://localhost:3003
cd apps/pos-app && pnpm dev      # http://localhost:3001
cd apps/driver-app && pnpm dev   # http://localhost:3000
```

### 5. Jalankan dengan Docker

```bash
cp .env.example .env  # isi JWT_SECRET
docker compose up -d
```

## Backend API Endpoints

### Auth
| Method | Path | Keterangan |
|--------|------|------------|
| POST | `/auth/login` | Login semua app (email + password) |
| POST | `/auth/refresh` | Refresh token |
| GET | `/auth/me` | Profil user saat ini |

### POS
| Method | Path | Keterangan |
|--------|------|------------|
| POST | `/pos/auth/login` | Login POS (username + password) |
| GET | `/pos/products` | Daftar produk POS |
| GET | `/pos/sessions` | Daftar sesi kasir |
| GET | `/pos/sessions/active` | Sesi aktif saat ini |
| POST | `/pos/sessions` | Buka sesi kasir |
| POST | `/pos/sessions/:id/close` | Tutup sesi kasir |
| GET | `/pos/transactions` | Riwayat transaksi |
| POST | `/pos/transactions` | Buat transaksi baru |
| GET | `/pos/reports/today` | Laporan hari ini |

### Fleet / Driver
| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/fleet/delivery/my-tasks` | Delivery tasks driver saat ini |
| GET | `/fleet/delivery/tasks/:id` | Detail satu delivery task |
| PATCH | `/fleet/delivery/tasks/:id/status` | Update status pengiriman |
| GET | `/fleet/delivery/history` | Riwayat pengiriman |
| GET | `/fleet/vehicles` | Daftar kendaraan |
| GET | `/fleet/stats` | Statistik armada |

### Inventory / Gudang
| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/inventory/products` | Daftar produk + stok |
| POST | `/inventory/products/:id/stok` | Update stok masuk/keluar |
| GET | `/inventory/stock-movements` | Riwayat mutasi stok |
| POST | `/inventory/stock-opnames` | Buat stok opname |
| GET | `/inventory/purchase-orders` | (dari purchasing module) |

### Sales
| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/sales/orders` | Daftar sales order |
| POST | `/sales/orders` | Buat SO baru |
| PATCH | `/sales/orders/:id/pengiriman` | Update status pengiriman |

## Struktur Monorepo

```
.
├── apps/
│   ├── backend/           ← NestJS + Prisma (port 6000)
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       └── modules/   ← auth, sales, inventory, pos, fleet, finance, crm, hr...
│   ├── web/               ← Admin dashboard (port 5000)
│   ├── sales-app/         ← Sales App (port 3002)
│   ├── gudang-app/        ← Gudang App (port 3003)
│   ├── pos-app/           ← POS Kasir (port 3001, emerald)
│   └── driver-app/        ← Driver App (port 3000, slate)
├── packages/
│   ├── types/             ← UserRole, AuthUser, ROLE_APP_MAP
│   ├── utils/             ← api.ts, auth.ts, format.ts
│   └── ui/                ← shared React components
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Environment Variables

### Backend (`apps/backend/.env`)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/erp_db
JWT_SECRET=your-strong-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=7d
PORT=6000
NODE_ENV=development
```

### Frontend Apps (semua sama)
```env
NEXT_PUBLIC_API_URL=http://localhost:6000
BACKEND_URL=http://localhost:6000
PORT=<lihat tabel di atas>
```

## User Roles

| Role | App | Akses |
|------|-----|-------|
| `ADMIN` | Semua | Full akses semua modul |
| `OWNER` | Semua | Read-only + approval |
| `SUPER_ADMIN` | Semua | Superuser system |
| `SALES` | sales-app | SO, customer, pipeline |
| `GUDANG` | gudang-app | Inventory, picking, opname |
| `KASIR` | pos-app | Transaksi POS, sesi kasir |
| `SUPERVISOR_KASIR` | pos-app | Kasir + manajemen sesi |
| `DRIVER` | driver-app | Delivery tasks, status update |

## Tech Stack

- **Backend**: NestJS 10, Prisma 5, PostgreSQL, JWT, bcrypt
- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Zustand, Axios
- **Shared**: TypeScript 5, pnpm workspaces
- **Infra**: Docker Compose, Replit (dev)
