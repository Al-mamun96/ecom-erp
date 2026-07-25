# Deploy — self-hosted VPS (Ubuntu + PostgreSQL + nginx)

Ecom-ERP is a single Next.js app. Runs comfortably on a 2 GB VPS. Target: Ubuntu
22.04/24.04. Replace `app.example.com` with your domain and `ecom` paths as needed.

---

## 1. Server prerequisites

```bash
# Node 22 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL, nginx, git
sudo apt-get install -y postgresql nginx git

node -v   # v22.x
```

## 2. PostgreSQL database

```bash
sudo -u postgres psql <<'SQL'
CREATE USER ecom WITH PASSWORD 'CHANGE_ME_STRONG';
CREATE DATABASE ecom_erp OWNER ecom;
SQL
```

Your `DATABASE_URL` will be:
`postgresql://ecom:CHANGE_ME_STRONG@localhost:5432/ecom_erp?schema=public`

## 3. Get the code & configure

```bash
sudo mkdir -p /var/www && cd /var/www
sudo git clone https://github.com/Al-mamun96/ecom-erp.git
sudo chown -R $USER:$USER /var/www/ecom-erp
cd /var/www/ecom-erp

cp .env.example .env
nano .env
```

Set in `.env` (see the reference at the bottom). **`AUTH_SECRET` must be strong
and never change after launch** — it also derives the courier-key encryption key,
so changing it invalidates stored Steadfast keys and all sessions.

```bash
# generate a secret
openssl rand -base64 32
```

## 4. Install, migrate, build

```bash
npm ci
npx prisma migrate deploy      # apply migrations (no dev prompts)
npx prisma db seed             # seed plans + super-admin (if ADMIN_* set)
npm run build
```

## 5. Run as a service (systemd)

Create `/etc/systemd/system/ecom-erp.service`:

```ini
[Unit]
Description=Ecom-ERP (Next.js)
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/var/www/ecom-erp
EnvironmentFile=/var/www/ecom-erp/.env
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /var/www/ecom-erp
sudo systemctl daemon-reload
sudo systemctl enable --now ecom-erp
sudo systemctl status ecom-erp        # should be active (running)
curl -I http://localhost:3000         # 200/307
```

> Lighter alternative to `npm start`: the build also emits a standalone bundle.
> To use it, copy assets once after each build and run the server directly:
> `cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public`
> then `ExecStart=/usr/bin/node .next/standalone/server.js`.

## 6. nginx reverse proxy

Create `/etc/nginx/sites-available/ecom-erp`:

```nginx
server {
    listen 80;
    server_name app.example.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ecom-erp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 7. HTTPS (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.example.com
```

Certbot rewrites the nginx config for TLS and auto-renews. After HTTPS is live,
set `APP_URL=https://app.example.com` in `.env` and restart the service.

## 8. Steadfast webhook (optional)

In the Steadfast portal, set the status webhook URL to:

```
https://app.example.com/api/courier/steadfast/webhook?token=<COURIER_WEBHOOK_SECRET>
```

Use the same value you put in `.env`. The endpoint fail-closes on a wrong/missing token.

---

## Updating (redeploy)

```bash
cd /var/www/ecom-erp
git pull
npm ci
npx prisma migrate deploy
npm run build
sudo systemctl restart ecom-erp
```

## Backups

```bash
# nightly DB dump (add to crontab -e)
0 2 * * * pg_dump -U ecom ecom_erp | gzip > /var/backups/ecom_erp_$(date +\%F).sql.gz
```

Keep product images on object storage + CDN as you grow (see `docs/COST.md`).

---

## `.env` reference

| Var | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Session JWT + courier-key encryption key. **Keep stable forever.** |
| `APP_URL` | Public URL (`https://app.example.com`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Super-admin created by `prisma db seed` |
| `COURIER_WEBHOOK_SECRET` | Guards the Steadfast status webhook |

Steadfast API keys are **not** in `.env` — each tenant enters their own in
Settings → Courier (stored AES-256-GCM encrypted).

## Notes
- No queue/cron is required: the order meter uses a per-month upsert counter, so
  each billing month gets its own row automatically.
- `APP_DEBUG`-style verbose logs are off in production (`NODE_ENV=production`).
- One 2 GB VPS serves tens of shops; scale vertically first (see `docs/COST.md`).
