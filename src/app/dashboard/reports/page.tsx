import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRange, bdt } from "@/lib/reports";
import { Icon, type IconName } from "@/components/icons";
import { ReportActions } from "./ReportActions";
import { DateFilter } from "./DateFilter";

const STATUS_COLORS: Record<string, string> = {
  pending: "#a1a1aa",
  confirmed: "#3b82f6",
  processing: "#6366f1",
  shipped: "#f59e0b",
  delivered: "#10b981",
  returned: "#f97316",
  cancelled: "#ef4444",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { user, ctx } = await requireTenant();
  const range = parseRange(await searchParams);
  const inRange = { gte: range.from, lte: range.to };
  const qs = `from=${range.fromStr}&to=${range.toStr}`;

  const [salesAgg, orderCount, txns, statusGroups, items] = await Promise.all([
    prisma.order.aggregate({
      where: { businessId: ctx.businessId, status: { not: "cancelled" }, createdAt: inRange },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { businessId: ctx.businessId, createdAt: inRange } }),
    prisma.transaction.findMany({
      where: { businessId: ctx.businessId, date: inRange },
      select: { type: true, amount: true, date: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { businessId: ctx.businessId, createdAt: inRange },
      _count: { _all: true },
    }),
    prisma.orderItem.findMany({
      where: {
        order: { businessId: ctx.businessId, status: { not: "cancelled" }, createdAt: inRange },
      },
      select: { name: true, qty: true, price: true },
    }),
  ]);

  const sales = Number(salesAgg._sum.total ?? 0);
  const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const net = sales + income - expense;

  // daily sales across the range (cap at 60 buckets)
  const dayCount = Math.min(
    60,
    Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1),
  );
  const days: { key: string; label: string; total: number }[] = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(range.from.getTime() + i * 86400000);
    days.push({ key: d.toISOString().slice(0, 10), label: `${d.getDate()}/${d.getMonth() + 1}`, total: 0 });
  }
  const dayIdx = new Map(days.map((d, i) => [d.key, i]));
  const salesRows = await prisma.order.findMany({
    where: { businessId: ctx.businessId, status: { not: "cancelled" }, createdAt: inRange },
    select: { total: true, createdAt: true },
  });
  for (const o of salesRows) {
    const i = dayIdx.get(o.createdAt.toISOString().slice(0, 10));
    if (i != null) days[i].total += Number(o.total);
  }
  const maxDay = Math.max(1, ...days.map((d) => d.total));

  const totalOrders = statusGroups.reduce((s, g) => s + g._count._all, 0);

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

  const kpis: { label: string; value: string; icon: IconName; from: string; to: string }[] = [
    { label: "Sales", value: bdt(sales), icon: "bag", from: "from-blue-500", to: "to-cyan-500" },
    { label: "Orders", value: `${orderCount}`, icon: "chart", from: "from-indigo-500", to: "to-violet-600" },
    { label: "Income", value: bdt(income), icon: "coins", from: "from-emerald-500", to: "to-teal-600" },
    { label: "Expense", value: bdt(expense), icon: "wallet", from: "from-rose-500", to: "to-red-600" },
    { label: "Net", value: bdt(net), icon: "chart", from: net >= 0 ? "from-violet-500" : "from-red-500", to: net >= 0 ? "to-purple-600" : "to-rose-600" },
  ];

  const reportLinks: { href: string; title: string; desc: string; icon: IconName; color: string }[] = [
    { href: "/dashboard/reports/sales", title: "Sales report", desc: "By status, payment & courier", icon: "bag", color: "text-blue-500 bg-blue-500/10" },
    { href: "/dashboard/reports/orders", title: "Orders report", desc: "Detailed order list", icon: "chart", color: "text-indigo-500 bg-indigo-500/10" },
    { href: "/dashboard/reports/income", title: "Income report", desc: "Order sales + other income", icon: "coins", color: "text-emerald-500 bg-emerald-500/10" },
    { href: "/dashboard/reports/expense", title: "Expense report", desc: "Expenses by category", icon: "wallet", color: "text-rose-500 bg-rose-500/10" },
    { href: "/dashboard/reports/profit-loss", title: "Profit & Loss", desc: "Sales + income − expenses", icon: "chart", color: "text-violet-500 bg-violet-500/10" },
    { href: "/dashboard/reports/payroll", title: "Payroll report", desc: "Salary payments", icon: "coins", color: "text-amber-500 bg-amber-500/10" },
  ];

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto print-area">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            {range.fromStr} → {range.toStr}
          </p>
        </div>
        <ReportActions type="orders" from={range.fromStr} to={range.toStr} />
      </div>
      <div className="mt-3">
        <DateFilter from={range.fromStr} to={range.toStr} />
      </div>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.from} ${k.to} flex items-center justify-center text-white shadow`}>
              <Icon name={k.icon} width={18} height={18} />
            </div>
            <div className="mt-3 text-xl font-bold tracking-tight">{k.value}</div>
            <div className="text-xs text-black/50 dark:text-white/50">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Report nav */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportLinks.map((r) => (
          <Link
            key={r.href}
            href={`${r.href}?${qs}`}
            className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-5 hover:border-foreground transition flex items-start gap-3"
          >
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.color}`}>
              <Icon name={r.icon} />
            </span>
            <span>
              <span className="block font-semibold">{r.title}</span>
              <span className="block text-sm text-black/50 dark:text-white/50">{r.desc}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Sales chart */}
      <div className="mt-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-5">
        <h2 className="font-semibold text-sm">Daily sales</h2>
        <div className="mt-4 overflow-x-auto">
          <svg viewBox={`0 0 720 230`} className="w-full min-w-[560px]" role="img">
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            {days.map((d, i) => {
              const bw = (720 - 48) / days.length;
              const h = (d.total / maxDay) * 176;
              const x = 24 + i * bw;
              return (
                <g key={d.key}>
                  <rect x={x + bw * 0.15} y={200 - h} width={bw * 0.7} height={Math.max(h, d.total > 0 ? 2 : 0)} rx={3} fill="url(#rg)" />
                  {days.length <= 31 && (
                    <text x={x + bw / 2} y={216} textAnchor="middle" className="fill-black/40 dark:fill-white/40" fontSize="9">
                      {d.label}
                    </text>
                  )}
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
            <p className="mt-4 text-sm text-black/40 dark:text-white/40">No orders in range.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {statusGroups.sort((a, b) => b._count._all - a._count._all).map((g) => {
                const pct = Math.round((g._count._all / totalOrders) * 100);
                return (
                  <div key={g.status}>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{g.status}</span>
                      <span className="text-black/50 dark:text-white/50">{g._count._all} · {pct}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: STATUS_COLORS[g.status] ?? "#6366f1" }} />
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
            <p className="mt-4 text-sm text-black/40 dark:text-white/40">No sales in range.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
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
