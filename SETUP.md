# Setup — bootstrap the Laravel app

> Run these on a machine where PHP 8.2+ and Composer work (your live server, or a
> PC with PHP installed). The Eltiz worktree's PC PHP is broken for composer, so do
> this where PHP runs cleanly.

## 1. Create the Laravel app *inside this folder*

```bash
cd C:/Users/User/ecom-erp
composer create-project laravel/laravel app
```

(That puts the framework in `ecom-erp/app-src`… actually simplest: create in place)

```bash
# in an empty ecom-erp (docs/ can stay):
composer create-project laravel/laravel .
```

If Composer complains the directory isn't empty, create in a subfolder and move:
```bash
composer create-project laravel/laravel _laravel
# then move _laravel/* into ecom-erp/
```

## 2. Core packages

```bash
composer require laravel/cashier            # subscriptions (Stripe) — or use SSLCommerz/bKash later
composer require barryvdh/laravel-dompdf    # PDF reports (same as Eltiz)
composer require laravel/breeze --dev && php artisan breeze:install blade
npm install && npm run build
```

## 3. Environment

```bash
cp .env.example .env
php artisan key:generate
# set DB_*, APP_URL, MAIL_*, and later STRIPE/SSLCOMMERZ keys
php artisan migrate
```

## 4. Multi-tenant scoping (single DB)

Every tenant table carries `business_id`. Add a global scope + a `BelongsToTenant`
trait so queries auto-filter by the logged-in user's business — the same pattern
Eltiz uses, but enforced globally instead of per-query. See `docs/ARCHITECTURE.md`.

## 5. Reuse from Eltiz

Port these modules almost as-is (strip production/POS bits):
- `OrderController`, `OrderService`, order views
- `SteadfastController` + courier webhook/COD logic (already hardened)
- `AccountController` (income/expense), `ReportController`, `ReportExportController`
- Payroll (salary-only slice of the employee module)

Then add the **subscription + order-metering** layer (new, see `docs/SUBSCRIPTION.md`).

---

Once bootstrapped, come back and we build module by module.
