import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUsage } from "@/lib/orders";
import { PlanCard } from "./PlanCard";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

function daysLeft(date: Date | null | undefined) {
  if (!date) return 0;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

export default async function BillingPage() {
  const { user, ctx } = await requireTenant();
  const sub = user.business!.subscription;

  const [usage, plans, invoices] = await Promise.all([
    getUsage(ctx.businessId),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { orderLimit: "asc" } }),
    prisma.invoice.findMany({
      where: { businessId: ctx.businessId },
      orderBy: { issuedAt: "desc" },
      take: 20,
    }),
  ]);

  const paidPlans = plans.filter((p) => p.slug !== "trial");
  const growthId = paidPlans.find((p) => p.slug === "growth")?.id;

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="text-sm text-black/50 dark:text-white/50">Your plan, usage and invoices</p>

      {/* Current plan */}
      <div className="mt-6 rounded-2xl p-6 text-white bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-xl shadow-violet-500/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-white/70">Current plan</span>
            <div className="text-2xl font-bold">
              {usage.planName ?? "—"}{" "}
              <span className="text-sm font-normal text-white/70">({sub?.status})</span>
            </div>
            {sub?.status === "trialing" && (
              <p className="text-sm text-white/80">Trial — {daysLeft(sub.trialEndsAt)} days left</p>
            )}
          </div>
          <div className="min-w-[200px]">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Orders this month</span>
              <span className="font-medium">
                {usage.used} / {usage.limit}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${usage.pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="mt-8 font-semibold">Plans</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paidPlans.map((p) => (
          <PlanCard
            key={p.id}
            plan={{ id: p.id, name: p.name, price: Number(p.price), orderLimit: p.orderLimit }}
            current={sub?.planId === p.id && sub?.status === "active"}
            highlight={p.id === growthId}
          />
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-black/[.03] dark:bg-white/[.03] p-4 text-sm text-black/60 dark:text-white/60">
        💳 Payment is manual for now: request a plan, then pay via bKash/bank. We activate your
        subscription once payment is confirmed.
      </div>

      {/* Invoices */}
      <h2 className="mt-8 font-semibold">Invoices</h2>
      {invoices.length === 0 ? (
        <p className="mt-3 text-sm text-black/50 dark:text-white/50">No invoices yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">For</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3 text-black/60 dark:text-white/60">
                    {inv.issuedAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {inv.gatewayRef?.replace("req:", "") ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{bdt(inv.amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        inv.status === "paid"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : inv.status === "failed"
                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {inv.status}
                    </span>
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
