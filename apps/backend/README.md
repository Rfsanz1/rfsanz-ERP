# Gentong Mas ERP — Backend

NestJS REST API untuk sistem ERP Gentong Mas. Dilengkapi JWT auth, Prisma ORM, PostgreSQL, dan Fleetbase adapter.

## Stack

- **Runtime**: Node.js 20 + TypeScript (ESM)
- **Framework**: NestJS v11
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT (passport-jwt + bcrypt)
- **Docs**: Swagger UI (`/docs-swagger`)

## Cara Menjalankan (Development)

### 1. Clone & Install

```bash
git clone https://github.com/username/gentong-mas-backend.git
cd gentong-mas-backend
npm install -g pnpm
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env — isi DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
```

### 3. Setup Database

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

### 4. Jalankan Server

```bash
# Development (hot reload)
pnpm start:dev

# Production
pnpm build && pnpm start
```

Server: `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs-swagger`

## Deploy dengan Docker

```bash
docker build -t gentong-mas-backend .
docker run -p 8000:8000 --env-file .env gentong-mas-backend
```

## Endpoint Utama

| Method | Path | Keterangan |
|--------|------|------------|
| POST | `/api/auth/login` | Login — dapat JWT token |
| GET | `/api/auth/me` | Profil user aktif |
| POST | `/api/auth/logout` | Logout |
| GET | `/docs-swagger` | Swagger UI |

### Fleetbase Adapter (`/int/v1/`)

| Method | Path |
|--------|------|
| POST | `/int/v1/auth/login` |
| GET | `/int/v1/auth/session` |
| POST | `/int/v1/auth/logout` |
| GET | `/int/v1/users/me` |
| GET | `/int/v1/two-fa/check` |
| GET | `/int/v1/users/locale` |
| GET | `/int/v1/auth/organizations` |

## Environment Variables

Lihat `.env.example` untuk daftar lengkap.

| Variable | Wajib | Keterangan |
|----------|-------|------------|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL |
| `JWT_SECRET` | ✅ | Secret untuk signing JWT |
| `ADMIN_EMAIL` | ✅ | Email login admin |
| `ADMIN_PASSWORD` | ✅ | Password login admin |
| `PORT` | - | Port server (default: 8000) |

## Login Default

```
Email    : admin@example.com
Password : admin123
```
