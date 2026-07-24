import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { ctx } = await requireTenant();

  const customer = await prisma.customer.findFirst({
    where: { id, businessId: ctx.businessId },
    include: {
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
    },
  });
  if (!customer) notFound();

  const spent = customer.orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);

  return (
    <main className="p-5 sm:p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/customers" className="text-sm text-black/50 dark:text-white/50">
        ← Customers
      </Link>

      {/* Header card */}
      <div className="mt-3 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-semibold">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{customer.name}</h1>
            <p className="text-sm text-black/60 dark:text-white/60">{customer.phone ?? "No phone"}</p>
            {customer.address && (
              <p className="text-sm text-black/50 dark:text-white/50 mt-0.5">{customer.address}</p>
            )}
            {customer.note && (
              <p className="text-xs text-black/40 dark:text-white/40 mt-1">Note: {customer.note}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{bdt(spent)}</div>
            <div className="text-xs text-black/50 dark:text-white/50">
              {customer.orders.length} order{customer.orders.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>

      {/* Order history */}
      <h2 className="mt-8 font-semibold">Order history</h2>
      {customer.orders.length === 0 ? (
        <p className="mt-3 text-sm text-black/50 dark:text-white/50">No orders yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((o) => (
                <tr key={o.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3 font-mono">{o.code}</td>
                  <td className="px-4 py-3 text-black/60 dark:text-white/60">
                    {o.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-black/60 dark:text-white/60">{o.items.length}</td>
                  <td className="px-4 py-3 text-right font-medium">{bdt(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60">
                      {o.status}
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
