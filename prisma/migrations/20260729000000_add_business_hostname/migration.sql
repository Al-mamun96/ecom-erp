-- Add per-tenant custom domain
ALTER TABLE "businesses" ADD COLUMN "hostname" TEXT;
CREATE UNIQUE INDEX "businesses_hostname_key" ON "businesses"("hostname");
