import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUsage } from "@/lib/orders";
import { Icon } from "@/components/icons";
import { StatusSelect } from "./StatusSelect";

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

export default async function OrdersPage() {
  const { ctx } = await requireTenant();
  const [orders, usage] = await Promise.all([
    prisma.order.findMany({
      where: { businessId: ctx.businessId },
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getUsage(ctx.businessId),
  ]);

  const limitReached = usage.limit > 0 && usage.remaining === 0;

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">অর্ডার</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            এই মাস: <span className="font-medium">{usage.used}</span> / {usage.limit} • মোট {orders.length} টি দেখানো হচ্ছে
          </p>
        </div>
        {limitReached ? (
          <span className="rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-2 text-sm font-medium">
            লিমিট শেষ — আপগ্রেড করুন
          </span>
        ) : (
          <Link
            href="/dashboard/orders/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/25 hover:opacity-95"
          >
            <Icon name="plus" width={18} height={18} /> নতুন অর্ডার
          </Link>
        )}
      </div>

      {usage.pct >= 80 && !limitReached && (
        <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-sm text-amber-700 dark:text-amber-300">
          ⚠️ এই মাসের অর্ডার লিমিটের {usage.pct}% ব্যবহার হয়েছে।
        </div>
      )}

      {orders.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-black/15 dark:border-white/15 p-12 text-center text-black/50 dark:text-white/50">
          এখনো কোনো অর্ডার নেই। উপরে <b>+ নতুন অর্ডার</b> দিয়ে শুরু করুন।
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">কোড</th>
                <th className="px-4 py-3 font-medium">কাস্টমার</th>
                <th className="px-4 py-3 font-medium">আইটেম</th>
                <th className="px-4 py-3 font-medium text-right">মোট</th>
                <th className="px-4 py-3 font-medium">পেমেন্ট</th>
                <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3 font-mono">{o.code}</td>
                  <td className="px-4 py-3">
                    <div>{o.customer?.name ?? "—"}</div>
                    {o.customer?.phone && (
                      <div className="text-xs text-black/40 dark:text-white/40">{o.customer.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-black/60 dark:text-white/60">{o.items.length} টি</td>
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
