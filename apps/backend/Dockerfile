FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./

RUN npm install --include=dev --legacy-peer-deps

COPY . .

RUN npx prisma generate && npm run build


FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    wget \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY prisma ./prisma
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

CMD ["/entrypoint.sh"]
