FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --frozen-lockfile

COPY apps/backend/ ./apps/backend/

RUN cd apps/backend && pnpm prisma generate && (pnpm build || true)

RUN test -f /app/apps/backend/dist/main.js || (echo "ERROR: dist/main.js tidak ditemukan" && exit 1)

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl wget

WORKDIR /app

# Copy semua file project
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/package.json

# Copy node_modules dari builder (sudah include prisma generated client)
COPY --from=builder /app/node_modules ./node_modules

# Copy hasil build dan schema prisma
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

WORKDIR /app/apps/backend

EXPOSE 6000

CMD ["sh", "-c", "cd /app/apps/backend && npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss && node /app/apps/backend/dist/main.js"]
