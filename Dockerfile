# Railway用 マルチステージビルド（web と cron で同一イメージを共用）
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* はビルド時にインライン化される（Railwayはサービス変数をビルド時にも注入する）
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# migrate / seed / nightly-reset を同一イメージから実行できるようにする
# （pg は standalone の node_modules にトレース済み）
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/db ./db
EXPOSE 3000
CMD ["node", "server.js"]
