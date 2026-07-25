import type { Prisma } from "@prisma/client";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon, type IconName } from "@/components/icons";
import { Filters } from "@/components/Filters";
import { AddTransaction } from "./AddTransaction";
import { deleteTransactionAction } from "./actions";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { ctx } = await requireTenant();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const typeFilter = sp.type === "income" || sp.type === "expense" ? sp.type : undefined;

  const listWhere: Prisma.TransactionWhereInput = {
    businessId: ctx.businessId,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(q
      ? {
          OR: [
            { category: { contains: q, mode: "insensitive" } },
            { note: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // Summary always reflects all-time totals (independent of list filters).
  const [salesAgg, incomeAgg, expenseAgg, txns] = await Promise.all([
    prisma.order.aggregate({
      where: { businessId: ctx.businessId, status: { not: "cancelled" } },
      _sum: { total: true },
    }),
    prisma.transaction.aggregate({ where: { businessId: ctx.businessId, type: "income" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { businessId: ctx.businessId, type: "expense" }, _sum: { amount: true } }),
    prisma.transaction.findMany({ where: listWhere, orderBy: { date: "desc" }, take: 300 }),
  ]);

  const sales = Number(salesAgg._sum.total ?? 0);
  const income = Number(incomeAgg._sum.amount ?? 0);
  const expense = Number(expenseAgg._sum.amount ?? 0);
  const net = sales + income - expense;

  const cards: { label: string; value: string; icon: IconName; from: string; to: string }[] = [
    { label: "Order sales", value: bdt(sales), icon: "bag", from: "from-blue-500", to: "to-cyan-500" },
    { label: "Other income", value: bdt(income), icon: "coins", from: "from-emerald-500", to: "to-teal-600" },
    { label: "Expenses", value: bdt(expense), icon: "wallet", from: "from-rose-500", to: "to-red-600" },
    {
      label: "Net profit",
      value: bdt(net),
      icon: "chart",
      from: net >= 0 ? "from-violet-500" : "from-red-500",
      to: net >= 0 ? "to-purple-600" : "to-rose-600",
    },
  ];

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            Cash book & profit — Net = order sales + other income − expenses
          </p>
        </div>
        <AddTransaction />
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-5"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center text-white shadow-lg`}>
              <Icon name={c.icon} />
            </div>
            <div className="mt-4 text-2xl font-bold tracking-tight">{c.value}</div>
            <div className="text-xs text-black/50 dark:text-white/50">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Cash book */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Cash book</h2>
        <Filters
          searchValue={q}
          searchPlaceholder="Search category or note…"
          selects={[
            {
              name: "type",
              value: typeFilter ?? "",
              options: [
                { value: "", label: "All types" },
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
              ],
            },
          ]}
        />
      </div>
      {txns.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-12 text-center text-black/50 dark:text-white/50">
          {q || typeFilter ? "No transactions match your filters." : (
            <>No transactions yet. Click <b>Add transaction</b> to record income or an expense.</>
          )}
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3 text-black/60 dark:text-white/60">
                    {t.date.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        t.type === "income"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {t.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-black/60 dark:text-white/60">{t.note ?? "—"}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      t.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {bdt(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteTransactionAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="text-red-500 hover:underline text-xs">Delete</button>
                    </form>
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
