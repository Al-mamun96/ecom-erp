import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { Filters } from "@/components/Filters";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

const payColor: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  partial: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  due: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { ctx } = await requireTenant();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = ["paid", "partial", "due"].includes(sp.status ?? "") ? sp.status : undefined;

  const where: Prisma.PurchaseWhereInput = {
    businessId: ctx.businessId,
    ...(status ? { paymentStatus: status } : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { supplier: { is: { name: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const purchases = await prisma.purchase.findMany({
    where,
    include: { supplier: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalSpent = purchases.reduce((s, p) => s + Number(p.total), 0);

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-sm text-[var(--muted)]">
            {purchases.length} shown · {bdt(totalSpent)} total
          </p>
        </div>
        <Link
          href="/dashboard/purchases/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/25 hover:opacity-95"
        >
          <Icon name="plus" width={18} height={18} /> New purchase
        </Link>
      </div>

      <div className="mt-4">
        <Filters
          searchValue={q}
          searchPlaceholder="Search code or supplier…"
          selects={[
            {
              name: "status",
              value: status ?? "",
              options: [
                { value: "", label: "All payments" },
                { value: "due", label: "Due" },
                { value: "partial", label: "Partial" },
                { value: "paid", label: "Paid" },
              ],
            },
          ]}
        />
      </div>

      {purchases.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-12 text-center text-[var(--muted)]">
          {q || status ? "No purchases match your filters." : "No purchases yet. Record your first stock purchase."}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium text-right">Items</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3 font-mono">
                    <Link href={`/dashboard/purchases/${p.id}`} className="text-indigo-500 hover:underline">
                      {p.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{p.date.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3">{p.supplier?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{p.items.length}</td>
                  <td className="px-4 py-3 text-right font-medium">{bdt(p.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs rounded-full px-2 py-0.5 capitalize ${payColor[p.paymentStatus]}`}>
                      {p.paymentStatus}
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
