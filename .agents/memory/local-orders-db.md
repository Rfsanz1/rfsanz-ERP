---
name: Local orders DB intercept
description: Backend remote NestJS tidak inject tenant saat create order (Prisma bug); solusi intercept di Next.js pakai Replit PostgreSQL lokal.
---

# Local Orders DB Intercept

## Masalah
Backend remote (`briskly-underpaid-shucking.ngrok-free.dev`) `POST /api/sales/orders` selalu 500 karena Prisma `Order.create()` butuh `tenant: { connect: { id: tenantId } }` tapi backend service tidak inject dari JWT. Field `tanggal` juga tidak ada di Prisma schema backend.

**Why:** NestJS ValidationPipe dan service code tidak handle tenant injection; tidak ada akses ke remote backend code untuk fix.

## Solusi
Next.js API routes take priority over `next.config.mjs` rewrites. Buat local intercept:
- `app/api/sales/orders/route.ts` → POST create + GET list (ke local DB)
- `app/api/orders/route.ts` → GET list orders (orders page baca dari `/orders` bukan `/sales/orders`)
- `app/api/orders/[id]/route.ts` → GET detail + PATCH update + DELETE

## Database
- Replit PostgreSQL lokal (`DATABASE_URL` env var sudah ada)
- Tabel: `local_orders`, `local_order_items`
- `pg` package diinstall di `apps/frontend`
- DB utility: `apps/frontend/lib/localDb.ts`
- SO number format: `SO-YYMMDD-RAND4`

## Kledo item format (confirmed working)
Items harus: `{ finance_account_id, name, qty, price, amount: qty*price, discount_percent }`
`include_tax` harus integer `0` atau `1` (bukan boolean).
