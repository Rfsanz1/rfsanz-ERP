FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

COPY package.json ./
RUN pnpm install

COPY . .

RUN pnpm prisma:generate && pnpm build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl wget

WORKDIR /app

COPY package.json ./
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --prod --ignore-scripts

RUN pnpm add prisma @prisma/client --save-prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm 2>/dev/null || true
COPY prisma ./prisma
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:8000/api/health || exit 1

CMD ["/entrypoint.sh"]
