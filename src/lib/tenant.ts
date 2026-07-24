/**
 * Tenant scoping helper.
 *
 * Prisma has no true global scope like Eloquent, so the rule for this codebase is:
 * NEVER query a tenant-owned table without a businessId filter. Use these helpers
 * so the businessId is always threaded through and never forgotten.
 *
 * See docs/ARCHITECTURE.md.
 */

export type TenantContext = {
  businessId: string;
  userId: string;
  role: "OWNER" | "STAFF" | "SUPER_ADMIN";
};

/** Build a `where` clause that is always scoped to the current tenant. */
export function scoped<T extends Record<string, unknown>>(
  ctx: Pick<TenantContext, "businessId">,
  where?: T,
): T & { businessId: string } {
  return { ...(where ?? ({} as T)), businessId: ctx.businessId };
}

/** Stamp businessId onto a create payload. */
export function withTenant<T extends Record<string, unknown>>(
  ctx: Pick<TenantContext, "businessId">,
  data: T,
): T & { businessId: string } {
  return { ...data, businessId: ctx.businessId };
}
