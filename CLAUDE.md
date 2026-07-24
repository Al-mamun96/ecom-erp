@AGENTS.md

# Ecom-ERP — project notes

Lite multi-tenant SaaS (order & business manager) for small e-commerce shops.
Separate product from Eltiz ERP — no manufacturing/POS/production. See `docs/`.

## Stack
- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, `src/`.
- **Prisma 6 + PostgreSQL** (Prisma 7 dropped inline `url = env()`; staying on 6).
- Deploy target: **self-hosted VPS** (`output: "standalone"` → `node .next/standalone/server.js`), NOT Vercel.

## Multi-tenancy
Single DB, `businessId` on every tenant-owned row. Prisma has no global scope, so
ALWAYS filter/stamp via `src/lib/tenant.ts` (`scoped()` / `withTenant()`). Never query
a tenant table without a businessId. See `docs/ARCHITECTURE.md`.

## Commands
- `npm run dev` — dev server (use `-- -p 3007` here; 3000 is used by another project).
- `npm run db:push` / `db:migrate` — schema to Postgres (needs DATABASE_URL).
- `npm run db:seed` — seed plans (Trial/Starter/Growth/Business).
- `npm run db:studio` — Prisma Studio.

## Status
Phase 0 done: scaffold + schema + landing page. Next: auth/signup → trial, then Orders.
See roadmap in `docs/PLAN.md`.
