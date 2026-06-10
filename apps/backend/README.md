# Modern Backend

This directory contains the new modern NestJS backend for the ERP migration.

## Goals
- Modular API architecture
- Auth + RBAC + audit logging
- Legacy bridge for Laravel fallback
- Prisma schema for domain evolution

## Commands
- `pnpm install`
- `pnpm --filter @erp-modern/backend dev` (or `pnpm --filter @erp-modern/backend start:dev`)
- `pnpm --filter @erp-modern/backend build`
