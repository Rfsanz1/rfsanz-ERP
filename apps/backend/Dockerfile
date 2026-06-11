FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --frozen-lockfile

COPY apps/backend/ ./apps/backend/

RUN pnpm --filter @erp-modern/backend build

RUN test -f /app/apps/backend/dist/main.js || \
    (echo "ERROR: dist/main.js tidak ditemukan" && exit 1)

# pnpm deploy creates a self-contained node_modules with real files (no pnpm symlinks).
# This is the recommended way to package pnpm workspace apps for Docker.
RUN pnpm --filter @erp-modern/backend deploy --prod /app/deploy

# Copy prisma schema into deploy dir, then generate the Prisma client there
# using the builder's prisma CLI. Output goes to /app/deploy/node_modules/@prisma/client
RUN cp -r /app/apps/backend/prisma /app/deploy/prisma && \
    /app/node_modules/.bin/prisma generate --schema=/app/deploy/prisma/schema.prisma

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl wget

WORKDIR /app/apps/backend

# Self-contained node_modules — real files, no pnpm virtual-store symlinks
COPY --from=builder /app/deploy/node_modules ./node_modules
# Compiled NestJS application
COPY --from=builder /app/apps/backend/dist ./dist
# Prisma schema (needed for db push at startup) + generated client inside node_modules
COPY --from=builder /app/deploy/prisma ./prisma

COPY apps/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 6000

CMD ["/entrypoint.sh"]
