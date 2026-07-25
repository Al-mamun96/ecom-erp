# Subscription & order metering

## Data model (new tables)

```
plans
  id, name, slug, order_limit (int, monthly), price (decimal),
  billing_period (monthly|yearly), features (json), is_active

subscriptions
  id, business_id, plan_id, status (trialing|active|past_due|canceled),
  current_period_start, current_period_end, trial_ends_at,
  gateway (stripe|sslcommerz|bkash|manual), gateway_ref, created_at

usage_counters
  id, business_id, period (YYYY-MM), orders_used (int)  -- unique(business_id, period)

invoices
  id, business_id, subscription_id, amount, status (paid|due|failed),
  issued_at, paid_at, gateway_ref
```

## Metering rules
- On **order create**, increment `usage_counters(business_id, current period).orders_used`.
- Before creating: `if orders_used >= plan.order_limit → block` with an upgrade CTA.
- Soft-warn banners at **80%** and **95%**.
- Counter resets each billing month (a scheduled job seeds the new period row).
- Trial: a temporary plan with `order_limit = 50`, `trial_ends_at = +7 days`.

## Billing
- **Simplest launch (BD):** `manual` gateway — you activate a subscription after a
  bKash/bank payment (super-admin marks paid). Zero integration to start.
- **Automated:** SSLCommerz or bKash PGW for local cards/MFS; Stripe (Cashier) if
  you sell internationally.
- Downgrade takes effect next period; upgrade is immediate (pro-rate optional).

## Enforcement points
- `orders.store` — the meter gate (main one).
- Middleware `EnsureActiveSubscription` on all tenant routes → redirect to a
  billing page when `status` is `canceled`/`past_due` past a grace window.
- Feature flags via `plan.features` (e.g. `pdf_reports`, `extra_couriers`,
  `staff_seats`) so higher tiers unlock more.

## Super-admin controls
- List tenants + plan + usage + revenue.
- Manually create/extend/suspend a subscription, mark invoice paid, reset a meter.
