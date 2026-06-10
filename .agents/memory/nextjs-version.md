---
name: Next.js version block
description: next@14.2.5 diblokir package firewall Replit; solusi upgrade ke 14.2.30
---

# Next.js Version Block

**Rule:** Jangan gunakan `next@14.2.5` — diblokir Replit package firewall dengan pesan "Blocked by Security Policy" (CVE keamanan).

**Why:** Next.js 14.2.5 memiliki security vulnerability yang diumumkan 2025-12-11. Replit memblokir versi ini via package firewall.

**How to apply:** Gunakan `next@14.2.30` (atau versi patch terbaru). Update package.json dan jalankan `pnpm update next --filter @erp-modern/frontend` untuk update lockfile.
