import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";

const bdt = (n: number) => "৳" + Math.round(n).toLocaleString("en-US");

const STATUS_COLORS: Record<string, string> = {
  pending: "#a1a1aa",
  confirmed: "#3b82f6",
  processing: "#6366f1",
  shipped: "#f59e0b",
  delivered: "#10b981",
  returned: "#f97316",
  cancelled: "#ef4444",
};

export default async function ReportsPage() {
  const { ctx } = await requireTenant();
  const now = new Date();
  const since = new Date(now.getTime() - 13 * 86400000);
  since.setHours(0, 0, 0, 0);

  const [recentOrders, statusGroups, items] = await Promise.all([
    prisma.order.findMany({
      where: { businessId: ctx.businessId, status: { not: "cancelled" }, createdAt: { gte: since } },
      select: { total: true, createdAt: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { businessId: ctx.businessId },
      _count: { _all: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { businessId: ctx.businessId, status: { not: "cancelled" } } },
      select: { name: true, qty: true, price: true },
    }),
  ]);

  // --- daily sales (last 14 days) ---
  const days: { label: string; key: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, label: `${d.getDate()}/${d.getMonth() + 1}`, total: 0 });
  }
  const dayIndex = new Map(days.map((d, i) => [d.key, i]));
  for (const o of recentOrders) {
    const idx = dayIndex.get(o.createdAt.toISOString().slice(0, 10));
    if (idx != null) days[idx].total += Number(o.total);
  }
  const maxDay = Math.max(1, ...days.map((d) => d.total));
  const total14 = days.reduce((s, d) => s + d.total, 0);

  // --- status breakdown ---
  const totalOrders = statusGroups.reduce((s, g) => s + g._count._all, 0);

  // --- top products ---
  const map = new Map<string, { qty: number; revenue: number }>();
  for (const it of items) {
    const cur = map.get(it.name) ?? { qty: 0, revenue: 0 };
    cur.qty += it.qty;
    cur.revenue += it.qty * Number(it.price);
    map.set(it.name, cur);
  }
  const topProducts = [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // chart geometry
  const W = 720;
  const H = 200;
  const pad = 24;
  const barW = (W - pad * 2) / days.length;

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            Last 14 days sales {bdt(total14)} · {totalOrders} orders all-time
          </p>
        </div>
        <a
          href="/dashboard/reports/export"
          className="inline-flex items-center gap-2 rounded-xl border border-black/15 dark:border-white/20 px-4 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Icon name="chart" width={18} height={18} /> Export orders (CSV)
        </a>
      </div>

      {/* Sales chart */}
      <div className="mt-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-5">
        <h2 className="font-semibold text-sm">Daily sales — last 14 days</h2>
        <div className="mt-4 overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full min-w-[560px]" role="img">
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            {days.map((d, i) => {
              const h = (d.total / maxDay) * (H - pad);
              const x = pad + i * barW;
              const y = H - h;
              return (
                <g key={d.key}>
                  <rect
                    x={x + barW * 0.15}
                    y={y}
                    width={barW * 0.7}
                    height={Math.max(h, d.total > 0 ? 2 : 0)}
                    rx={4}
                    fill="url(#barGrad)"
                  />
                  <text
                    x={x + barW / 2}
                    y={H + 16}
                    textAnchor="middle"
                    className="fill-black/40 dark:fill-white/40"
                    fontSize="10"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-5">
          <h2 className="font-semibold text-sm">Order status breakdown</h2>
          {totalOrders === 0 ? (
            <p className="mt-4 text-sm text-black/40 dark:text-white/40">No orders yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {statusGroups
                .sort((a, b) => b._count._all - a._count._all)
                .map((g) => {
                  const pct = Math.round((g._count._all / totalOrders) * 100);
                  return (
                    <div key={g.status}>
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{g.status}</span>
                        <span className="text-black/50 dark:text-white/50">
                          {g._count._all} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: STATUS_COLORS[g.status] ?? "#6366f1" }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-5">
          <h2 className="font-semibold text-sm">Top products (by revenue)</h2>
          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-black/40 dark:text-white/40">No sales yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{p.name}</span>
                  <span className="text-xs text-black/40 dark:text-white/40">{p.qty} sold</span>
                  <span className="text-sm font-medium">{bdt(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
