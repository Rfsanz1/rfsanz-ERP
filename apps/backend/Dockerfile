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
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN apk add --no-cache openssl wget

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --frozen-lockfile --prod

# Copy schema prisma untuk generate & migrate
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# Generate Prisma client di runner (lebih reliable dari copy path pnpm)
RUN cd apps/backend && pnpm prisma generate

# Copy hasil build
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend

EXPOSE 6000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=/app/apps/backend/prisma/schema.prisma && node /app/apps/backend/dist/main.js"]
