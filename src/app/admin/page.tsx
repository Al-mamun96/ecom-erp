import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { activateInvoiceAction, setSubscriptionAction, resetMeterAction } from "./actions";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");
const period = () => new Date().toISOString().slice(0, 7);

export default async function AdminPage() {
  await requireAdmin();

  const [businesses, plans, counters, dueInvoices] = await Promise.all([
    prisma.business.findMany({
      include: {
        subscription: { include: { plan: true } },
        users: { where: { role: "OWNER" }, take: 1 },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { orderLimit: "asc" } }),
    prisma.usageCounter.findMany({ where: { period: period() } }),
    prisma.invoice.findMany({
      where: { status: "due" },
      include: { business: true },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  const usageMap = new Map(counters.map((c) => [c.businessId, c.ordersUsed]));

  const active = businesses.filter((b) => b.subscription?.status === "active");
  const trialing = businesses.filter((b) => b.subscription?.status === "trialing");
  const mrr = active.reduce((s, b) => s + Number(b.subscription?.plan.price ?? 0), 0);

  const kpis = [
    { label: "Tenants", value: `${businesses.length}`, from: "from-indigo-500", to: "to-violet-600" },
    { label: "Active subs", value: `${active.length}`, from: "from-emerald-500", to: "to-teal-600" },
    { label: "Trialing", value: `${trialing.length}`, from: "from-amber-500", to: "to-orange-500" },
    { label: "MRR", value: bdt(mrr), from: "from-fuchsia-500", to: "to-pink-600" },
  ];

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Overview</h1>

      {/* KPIs */}
      <div className="mt-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl p-5 text-white bg-gradient-to-br ${k.from} ${k.to} shadow-lg`}
          >
            <div className="text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-white/80">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Pending requests */}
      <h2 className="mt-8 font-semibold">Pending payment requests</h2>
      {dueInvoices.length === 0 ? (
        <p className="mt-2 text-sm text-black/50 dark:text-white/50">No pending requests.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {dueInvoices.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3"
            >
              <div className="text-sm">
                <span className="font-medium">{inv.business.name}</span> wants{" "}
                <span className="capitalize font-medium">
                  {inv.gatewayRef?.replace("req:", "")}
                </span>{" "}
                — {bdt(inv.amount)}
                <span className="text-black/40 dark:text-white/40">
                  {" "}
                  · {inv.issuedAt.toISOString().slice(0, 10)}
                </span>
              </div>
              <form action={activateInvoiceAction}>
                <input type="hidden" name="invoiceId" value={inv.id} />
                <button className="rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-sm font-medium hover:opacity-90">
                  Mark paid & activate
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Tenants */}
      <h2 className="mt-8 font-semibold">Tenants</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Plan / status</th>
              <th className="px-4 py-3 font-medium text-right">Usage</th>
              <th className="px-4 py-3 font-medium">Manage</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => {
              const sub = b.subscription;
              const used = usageMap.get(b.id) ?? 0;
              const limit = sub?.plan.orderLimit ?? 0;
              return (
                <tr key={b.id} className="border-t border-black/5 dark:border-white/5 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-black/40 dark:text-white/40">
                      {b._count.orders} orders
                    </div>
                  </td>
                  <td className="px-4 py-3 text-black/60 dark:text-white/60">
                    {b.users[0]?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div>{sub?.plan.name ?? "—"}</div>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        sub?.status === "active"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : sub?.status === "trialing"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-red-500/15 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {sub?.status ?? "none"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {used} / {limit}
                  </td>
                  <td className="px-4 py-3">
                    <form action={setSubscriptionAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="businessId" value={b.id} />
                      <select
                        name="planId"
                        defaultValue={sub?.planId ?? plans[0]?.id}
                        className="rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-xs"
                      >
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <select
                        name="status"
                        defaultValue={sub?.status ?? "active"}
                        className="rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-xs"
                      >
                        {["trialing", "active", "past_due", "canceled"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button className="rounded-lg bg-foreground text-background px-2.5 py-1 text-xs font-medium">
                        Set
                      </button>
                    </form>
                    <form action={resetMeterAction} className="mt-1">
                      <input type="hidden" name="businessId" value={b.id} />
                      <button className="text-xs text-indigo-500 hover:underline">Reset meter</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
