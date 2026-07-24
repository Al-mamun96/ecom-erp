# Running cost — hosting, DB, bandwidth

Single-DB multi-tenant Laravel. Per-tenant cost at this scale is tiny; you pay for
one server that hosts all tenants. Numbers are monthly, USD (≈ BDT ×120).

## Stage 1 — MVP / first customers (up to ~30–50 small shops)

| Item | Provider example | Cost/mo |
|---|---|---|
| VPS 2 GB RAM / 1–2 vCPU / 40 GB SSD | Hostinger, Contabo, DigitalOcean, Vultr | $6–12 |
| MySQL | on the same VPS | $0 |
| Bandwidth | usually 1–2 TB included in VPS | $0 |
| SSL | Let's Encrypt | $0 |
| Domain | Namecheap/Cloudflare | ~$1 (≈$12/yr) |
| Transactional email | Resend/Brevo/Mailgun free tier | $0 |
| SMS (BD) | per-SMS, pass-through to tenant | usage |
| Backups | S3/Backblaze B2 | $1–3 |
| **Total** | | **~$10–15/mo** |

## Stage 2 — Growth (~100–300 active shops)

| Item | Cost/mo |
|---|---|
| VPS 4–8 GB / 2–4 vCPU | $20–40 |
| Managed MySQL (optional, for backups/HA) | $15–25 |
| Redis (queues/cache) — on VPS or managed | $0–15 |
| CDN (Cloudflare free/pro) | $0–20 |
| Object storage (images/backups) | $3–10 |
| **Total** | **~$40–90/mo** |

## Notes
- **Order tiers (500/1500/2000) do NOT drive infra cost** — a 2,000-order shop
  uses trivial DB/bandwidth. The meter is a *pricing* lever, not a cost one.
- **Break-even is fast:** even at Stage 2 ($90/mo), ~15 Starter subs (৳500 each ≈
  $60) or ~8 Growth subs cover the whole infra. Everything above is margin.
- Keep **images on object storage + CDN** early — it's the main bandwidth/storage
  growth item as shops upload product photos.
- **Queue workers + a scheduler** (supervisor/systemd) for webhooks, emails,
  metering resets — plan for 1 small worker process on the VPS.

## Rough per-tenant economics
- Infra cost per active tenant: **well under $1/month** at Stage 2.
- Sell Starter at ৳500 (~$4) → ~$3+ gross margin per tenant/month.
- 100 paying tenants ≈ ৳50,000/mo (~$400) revenue vs ~$90 infra → healthy.
