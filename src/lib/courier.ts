import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import type { SteadfastCreds } from "@/lib/steadfast";

/** Load and decrypt a tenant's Steadfast credentials, or null if not configured. */
export async function getSteadfastCreds(businessId: string): Promise<SteadfastCreds | null> {
  const b = await prisma.business.findUnique({
    where: { id: businessId },
    select: { steadfastApiKey: true, steadfastSecretKey: true },
  });
  if (!b?.steadfastApiKey || !b?.steadfastSecretKey) return null;
  try {
    return {
      apiKey: decryptSecret(b.steadfastApiKey),
      secretKey: decryptSecret(b.steadfastSecretKey),
    };
  } catch {
    return null;
  }
}
