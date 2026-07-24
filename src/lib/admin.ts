import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Require a signed-in SUPER_ADMIN. Super-admins have no businessId and can read
 * across all tenants (the /admin area runs outside the per-tenant scope).
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");
  return user;
}
