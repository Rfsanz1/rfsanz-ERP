---
name: ApiV1Module architecture for Open TMS integration
description: Key decisions for the /api/v1/* module added to integrate Open TMS frontend with RFSANZ ERP backend.
---

## Module location
`src/modules/api-v1/api-v1.module.ts` — standalone module imported by AppModule.

## Auth pattern
`AuthV1Controller` does NOT inject `AuthV1Service` via DI (to avoid esbuild metadata issues). JWT sign/verify is done inline using `createRequire` for `jsonwebtoken` and `bcrypt`. `StrictJwtGuard` in `src/modules/api-v1/guards/strict-jwt.guard.ts` verifies Bearer tokens on all protected routes.

## TMS model conventions
- All Prisma models prefixed `Tms` (e.g., `TmsShipment`, `TmsCarrier`)
- Use `orgId` field (default `"default"`) not `tenantId` to avoid RFSANZ data conflicts
- `TmsShipment.customerId` is nullable (migration applied)
- `TmsComment`/`TmsAttachment` use `entityType`+`entityId` polymorphic pattern

## Global response format
All responses wrapped as `{ data, error }` via `ResponseInterceptor` and `HttpExceptionFilter` in `src/common/`.

## Service sanitization
All create/update methods in TMS services use explicit field allowlists (`sanitize()`) to avoid Prisma unknown-field errors from loose API DTOs.

**Why:** The Prisma schema was designed for Open TMS frontend field names which sometimes differ from REST conventions (e.g. `address1` not `address`, no `code` field on carriers).
