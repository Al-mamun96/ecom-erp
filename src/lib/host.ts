import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/** Hostnames that serve the main SaaS app itself (not a tenant). */
export function mainHosts(): string[] {
  return (process.env.APP_HOSTS ?? "app.sufiya.shop,localhost")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/** Current request hostname (no port), lowercased. */
export async function getHost(): Promise<string | null> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return null;
  return host.split(":")[0].toLowerCase();
}

/**
 * The tenant bound to the current request's domain, or null when the request is
 * on a main SaaS host (app.sufiya.shop / localhost) or an unmapped domain.
 */
export async function getBusinessByHost() {
  const host = await getHost();
  if (!host || mainHosts().includes(host)) return null;
  return prisma.business.findUnique({ where: { hostname: host } });
}
