# Ecom-ERP (working name) — SaaS Order & Business Manager

A **lite, multi-tenant SaaS** for regular e-commerce businesses. It keeps only the
core "run my shop" features — **Orders, Courier, Income, Expense, Payroll,
Accounts, Reports** — and is sold on a **subscription** priced by monthly order
volume (e.g. 500 / 1,500 / 2,000 orders).

This is a separate product from the full Eltiz ERP (which also has manufacturing,
POS, production pipeline, employee/production management). Those heavy modules are
intentionally **left out** here.

---

## 1. Stack decision — **Laravel** (recommended)

| Option | Verdict |
|---|---|
| **Laravel (PHP)** ✅ | Reuse everything you already built. Laravel Cashier for subscriptions. Cheap PHP hosting. Fastest time-to-market. Chosen. |
| Next.js | Would need a separate API + DB layer, full rewrite, no reuse. Better only if you want a heavy SPA/mobile-first build. Not worth it here. |

**Why Laravel wins for you specifically:** your existing Eltiz ERP is already a
single-database multi-tenant Laravel app scoped by `business_id`. This new product
is essentially *"fork it, delete manufacturing/POS/production, add a billing +
order-metering layer."* Reuse = weeks saved.

### Architecture
- **Single database, `tenant_id` (business_id) on every row** — the model you
  already use. Cheapest and scales to thousands of small tenants. (Not
  database-per-tenant — unnecessary ops cost at this scale.)
- **Laravel 11/12 + Blade + Alpine + Tailwind** (same as Eltiz, so UI reuse).
- **Laravel Cashier** (Stripe) or a local **bKash/SSLCommerz** gateway for BD.
- **Queue (database/Redis)** for courier webhooks, emails, SMS.

---

## 2. Core modules (only these)

1. **Auth & Tenant** — signup → creates a business (tenant) → 14-day trial.
2. **Orders** — create/edit, statuses, customer info, COD.
3. **Courier** — Steadfast/Pathao/RedX send + webhook status + COD reconcile
   (port straight from Eltiz).
4. **Income / Expense** — cash book, categories.
5. **Payroll** — staff salary + payments (simplified: salary only, no piece-rate).
6. **Accounts** — P&L, balances, payment transfer.
7. **Reports** — sales, P&L, order analytics, courier, exports (CSV/PDF).
8. **Products & Customers** — light catalog + customer ledger (needed by orders).
9. **Subscription & Billing** — plan, order metering, upgrade/downgrade, invoices.
10. **Super-admin** — tenants list, plans, revenue, suspend/extend.

Explicitly **excluded:** manufacturing, BOM, production pipeline, POS,
worker/task management, warehouse transfers.

---

## 3. Subscription model (order-metered)

Plans gate on **orders created per billing month** (not infra cost — at this scale
the DB/bandwidth cost per tenant is tiny; the meter is a value/pricing lever).

| Plan | Orders / month | Suggested price (BDT/mo) |
|---|---|---|
| Trial | 50 (14 days) | Free |
| Starter | 500 | 500–800 |
| Growth | 1,500 | 1,200–1,800 |
| Business | 2,000 | 1,800–2,500 |
| Unlimited / custom | 5,000+ | negotiate |

- Enforce with a `plan_order_limit` + a monthly counter; block/soft-warn at 90%
  and 100%.
- Annual = 2 months free (retention lever).
- Add-ons later: extra SMS, extra couriers, extra staff seats.

See `docs/SUBSCRIPTION.md`.

---

## 4. Hosting / running cost (see `docs/COST.md`)

Short version, starting out (tens of tenants):
- **1 VPS** (2 GB / 2 vCPU): ~$6–12/mo (Hostinger/Contabo/DigitalOcean).
- **MySQL**: on the same VPS (free) until you grow, then managed ~$15/mo.
- **Domain**: ~$12/yr. **SSL**: free (Let's Encrypt).
- **Transactional email/SMS**: free tier → a few dollars.
- **Backups**: object storage a few dollars.

**Realistic MVP infra: ~$10–15/month.** Scales linearly; a single 4 GB VPS
comfortably serves a few hundred active small shops.

---

## 5. Build roadmap

- **Phase 0** — bootstrap Laravel, tenancy scaffolding, auth+signup+trial. (`SETUP.md`)
- **Phase 1** — Orders + Customers + Products (core loop).
- **Phase 2** — Courier integration + webhooks + COD reconcile.
- **Phase 3** — Income/Expense/Accounts + Reports.
- **Phase 4** — Payroll.
- **Phase 5** — Subscription, order metering, billing, super-admin.
- **Phase 6** — Polish, onboarding, docs, launch.

Start at `SETUP.md`.
