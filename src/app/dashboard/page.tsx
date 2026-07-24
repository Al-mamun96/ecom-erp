import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUsage } from "@/lib/orders";
import { Icon, type IconName } from "@/components/icons";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

function daysLeft(date: Date | null | undefined) {
  if (!date) return 0;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

export default async function DashboardPage() {
  const { user, ctx } = await requireTenant();
  const business = user.business!;
  const sub = business.subscription;

  const [usage, totalOrders, customerCount, revenueAgg, recent] = await Promise.all([
    getUsage(ctx.businessId),
    prisma.order.count({ where: { businessId: ctx.businessId } }),
    prisma.customer.count({ where: { businessId: ctx.businessId } }),
    prisma.order.aggregate({
      where: { businessId: ctx.businessId, status: { not: "cancelled" } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { businessId: ctx.businessId },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const revenue = revenueAgg._sum.total ?? 0;

  const stats: {
    label: string;
    value: string;
    icon: IconName;
    from: string;
    to: string;
  }[] = [
    { label: "Total sales", value: bdt(revenue), icon: "wallet", from: "from-violet-500", to: "to-purple-600" },
    { label: "Orders this month", value: `${usage.used}`, icon: "bag", from: "from-blue-500", to: "to-cyan-500" },
    { label: "Total orders", value: `${totalOrders}`, icon: "chart", from: "from-amber-500", to: "to-orange-500" },
    { label: "Customers", value: `${customerCount}`, icon: "users", from: "from-emerald-500", to: "to-teal-600" },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.name.split(" ")[0]} 👋</h1>
          <p className="text-sm text-black/50 dark:text-white/50">{business.name} — today&apos;s snapshot</p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/25 hover:opacity-95"
        >
          <Icon name="plus" width={18} height={18} /> New order
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-5"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center text-white shadow-lg`}>
              <Icon name={s.icon} />
            </div>
            <div className="mt-4 text-2xl font-bold tracking-tight">{s.value}</div>
            <div className="text-xs text-black/50 dark:text-white/50">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Trial / plan card */}
        <div className="lg:col-span-1 rounded-2xl p-6 text-white bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-xl shadow-violet-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-white/70">Plan</span>
            {sub?.status === "trialing" && (
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium">
                Trial
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-bold">{usage.planName ?? "—"}</div>
          {sub?.status === "trialing" && (
            <p className="text-sm text-white/80">{daysLeft(sub.trialEndsAt)} days left</p>
          )}

          <div className="mt-5">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Orders</span>
              <span className="font-medium">
                {usage.used} / {usage.limit}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${usage.pct}%` }} />
            </div>
          </div>

          <Link
            href="/dashboard/billing"
            className="mt-5 inline-block rounded-lg bg-white/15 hover:bg-white/25 px-4 py-2 text-sm font-medium transition"
          >
            Upgrade →
          </Link>
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/dashboard/orders" className="text-sm text-indigo-500 hover:underline">
              View all
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="mt-6 text-center text-sm text-black/40 dark:text-white/40 py-8">
              No orders yet.{" "}
              <Link href="/dashboard/orders/new" className="text-indigo-500 hover:underline">
                Add your first order
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-black/5 dark:divide-white/5">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-black/40 dark:text-white/40">{o.code}</span>
                    <span className="text-sm">{o.customer?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{bdt(o.total)}</span>
                    <span className="text-[11px] rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60">
                      {o.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
