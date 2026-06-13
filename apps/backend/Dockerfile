FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache openssl

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
    pnpm install --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client \
     ./node_modules/@prisma/client 2>/dev/null || true
COPY prisma ./prisma
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

CMD ["/entrypoint.sh"]
