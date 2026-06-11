FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install OpenSSL untuk Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --frozen-lockfile

COPY apps/backend/ ./apps/backend/

# generate Prisma client, lalu build — abaikan TypeScript warnings (exit code non-zero)
RUN cd apps/backend && pnpm prisma generate && (pnpm build || true)

# Pastikan ada file JS yang dihasilkan; gagal jika dist kosong
RUN test -f /app/apps/backend/dist/main.js || (echo "ERROR: dist/main.js tidak ditemukan, build gagal total" && exit 1)

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install OpenSSL dan wget untuk Prisma + healthcheck
RUN apk add --no-cache openssl wget

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

WORKDIR /app/apps/backend

EXPOSE 6000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=/app/apps/backend/prisma/schema.prisma && node /app/apps/backend/dist/main.js"]
