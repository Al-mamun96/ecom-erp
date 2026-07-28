import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getUsage } from "@/lib/orders";
import { Icon } from "@/components/icons";
import { Filters } from "@/components/Filters";
import { StatusSelect } from "./StatusSelect";

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;

const statusColor: Record<string, string> = {
  pending: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300",
  confirmed: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  processing: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  shipped: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  returned: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  cancelled: "bg-red-500/15 text-red-600 dark:text-red-400",
};

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { ctx } = await requireTenant();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number])
    ? (sp.status as (typeof STATUSES)[number])
    : undefined;

  const where: Prisma.OrderWhereInput = {
    businessId: ctx.businessId,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { customer: { is: { name: { contains: q, mode: "insensitive" } } } },
            { customer: { is: { phone: { contains: q } } } },
          ],
        }
      : {}),
  };

  const [orders, usage] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    getUsage(ctx.businessId),
  ]);

  const limitReached = usage.limit > 0 && usage.remaining === 0;

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            This month: <span className="font-medium">{usage.used}</span> / {usage.limit} • showing {orders.length}
          </p>
        </div>
        {limitReached ? (
          <span className="rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-2 text-sm font-medium">
            Limit reached — upgrade
          </span>
        ) : (
          <Link
            href="/dashboard/orders/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/25 hover:opacity-95"
          >
            <Icon name="plus" width={18} height={18} /> New order
          </Link>
        )}
      </div>

      <div className="mt-4">
        <Filters
          searchValue={q}
          searchPlaceholder="Search code, customer, phone…"
          selects={[
            {
              name: "status",
              value: status ?? "",
              options: [
                { value: "", label: "All statuses" },
                ...STATUSES.map((s) => ({ value: s, label: s })),
              ],
            },
          ]}
        />
      </div>

      {usage.pct >= 80 && !limitReached && (
        <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-sm text-amber-700 dark:text-amber-300">
          ⚠️ You&apos;ve used {usage.pct}% of this month&apos;s order limit.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-black/15 dark:border-white/15 p-12 text-center text-black/50 dark:text-white/50">
          {q || status ? "No orders match your filters." : "No orders yet. Use + New order above to get started."}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3 font-mono">
                    <Link href={`/dashboard/orders/${o.id}`} className="text-indigo-500 hover:underline">
                      {o.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{o.customer?.name ?? "—"}</div>
                    {o.customer?.phone && (
                      <div className="text-xs text-black/40 dark:text-white/40">{o.customer.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-black/60 dark:text-white/60">{o.items.length}</td>
                  <td className="px-4 py-3 text-right font-medium">{bdt(o.total)}</td>
                  <td className="px-4 py-3 uppercase text-xs">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <StatusSelect id={o.id} status={o.status} className={statusColor[o.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
