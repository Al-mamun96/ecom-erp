import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";
import type { TenantContext } from "@/lib/tenant";

/** Current logged-in user (with business), or null. */
export async function getCurrentUser() {
  const session = await readSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    include: { business: { include: { subscription: { include: { plan: true } } } } },
  });
}

/** Require a logged-in tenant user; redirects to /login otherwise. */
export async function requireTenant(): Promise<{
  ctx: TenantContext;
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
}> {
  const user = await getCurrentUser();
  if (!user || !user.businessId) redirect("/login");
  return {
    user,
    ctx: {
      businessId: user.businessId!,
      userId: user.id,
      role: user.role as TenantContext["role"],
    },
  };
}
