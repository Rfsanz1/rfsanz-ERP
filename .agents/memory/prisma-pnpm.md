---
name: Prisma pnpm version
description: Backend pakai prisma@5, root pakai prisma@7; cara menjalankan prisma CLI yang benar
---

# Prisma pnpm Version Conflict

**Rule:** Jalankan prisma CLI di backend dengan `pnpm --filter @erp-modern/backend exec prisma <command>` — jangan pakai `npx prisma` karena akan menggunakan prisma@7.8.0 dari root yang tidak kompatibel dengan schema.

**Why:** Root package.json punya `prisma@7.8.0` yang memerlukan format konfigurasi berbeda (`prisma.config.ts` dan menghapus `url` dari datasource). Backend menggunakan `prisma@5.22.0` yang masih support format schema lama.

**How to apply:** Selalu gunakan `pnpm --filter @erp-modern/backend exec prisma generate/db push/db seed`.
