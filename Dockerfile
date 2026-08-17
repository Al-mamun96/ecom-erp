# syntax=docker/dockerfile:1
# Ecom-ERP — Next.js 16 + Prisma + PostgreSQL. Builds cleanly on Coolify (Dockerfile build pack).
# Provide env vars in Coolify: DATABASE_URL, AUTH_SECRET, APP_URL, APP_HOSTS, ADMIN_*, COURIER_WEBHOOK_SECRET.

FROM node:22-slim AS base
# openssl is required by the Prisma query engine
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Build stage: install deps, generate Prisma client, build Next ----
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
# Placeholder only so `next build` never fails on a missing env — no DB is contacted
# at build time (all data pages are dynamic). Real values are injected at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV AUTH_SECRET="build-time-placeholder"
RUN npm run build

# ---- Runtime stage ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
# Copy the built app + deps (includes the generated Prisma client and the CLI for migrations)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
# Apply DB migrations on boot, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
