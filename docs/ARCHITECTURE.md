# Architecture — multi-tenancy (single DB)

## Tenant = business
Signup creates a `businesses` row (the tenant) + an owner `users` row. Every
tenant-owned table has `business_id`.

## Auto-scoping (the one thing to get right)
Instead of writing `->where('business_id', ...)` on every query (error-prone —
that's how cross-tenant leaks happen), enforce it globally:

```php
// app/Models/Concerns/BelongsToTenant.php
trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function ($q) {
            if (auth()->check()) {
                $q->where($q->getModel()->getTable().'.business_id', auth()->user()->business_id);
            }
        });
        static::creating(function ($m) {
            if (auth()->check() && empty($m->business_id)) {
                $m->business_id = auth()->user()->business_id;
            }
        });
    }
}
```

Add `use BelongsToTenant;` to Order, Customer, Product, Transaction, Employee,
Shipment, etc. Now every read is auto-filtered and every write auto-stamped.
Super-admin queries run in a context where the scope is disabled.

## Layers
- **HTTP** — controllers stay thin; validation via FormRequests.
- **Services** — OrderService, CourierService, BillingService (port + adapt from Eltiz).
- **Jobs/Queue** — courier webhooks processing, emails, SMS, monthly meter reset.
- **Events** — `OrderCreated` → increment usage; `SubscriptionExpired` → gate.

## Security baseline (carry over the Eltiz audit lessons)
- Global tenant scope (above) — kills IDOR/cross-tenant leaks by default.
- Secrets in `config/*` read with `config()` (never raw `env()` in app code).
- Webhooks: verify HMAC/secret, fail-closed.
- Encrypt API keys at rest (`'x' => 'encrypted'` casts).
- Rate-limit auth; validate all uploads (`image|mimes|max`).
- `APP_DEBUG=false` in prod.

## Deploy
- 1 VPS: nginx + PHP-FPM + MySQL + Redis + a queue worker (systemd) + cron
  (`schedule:run`).
- CI: push → server `git pull` + `migrate --force` + `optimize` (config/route/view
  cache) — but keep secrets in `config/`, not raw `env()`, so caching is safe.
