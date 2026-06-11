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

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/package.json

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

COPY apps/backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

WORKDIR /app/apps/backend

EXPOSE 6000

CMD ["/app/entrypoint.sh"]
