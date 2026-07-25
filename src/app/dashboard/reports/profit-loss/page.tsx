import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRange, bdt } from "@/lib/reports";
import { ReportHeader } from "../ReportHeader";
import { ReportTable } from "../parts";

export default async function ProfitLossReport({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { user, ctx } = await requireTenant();
  const range = parseRange(await searchParams);
  const inRange = { gte: range.from, lte: range.to };

  const [salesAgg, txns] = await Promise.all([
    prisma.order.aggregate({
      where: { businessId: ctx.businessId, status: { not: "cancelled" }, createdAt: inRange },
      _sum: { total: true },
    }),
    prisma.transaction.findMany({
      where: { businessId: ctx.businessId, date: inRange },
      select: { type: true, category: true, amount: true },
    }),
  ]);

  const orderSales = Number(salesAgg._sum.total ?? 0);
  const otherIncome = txns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenseTotal = txns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = orderSales + otherIncome;
  const net = totalIncome - expenseTotal;

  const expenseByCat = new Map<string, number>();
  for (const t of txns) if (t.type === "expense") expenseByCat.set(t.category, (expenseByCat.get(t.category) ?? 0) + Number(t.amount));

  const rows: React.ReactNode[][] = [
    [<b key="i">Income</b>, ""],
    ["  Order sales", bdt(orderSales)],
    ["  Other income", bdt(otherIncome)],
    [<b key="ti">Total income</b>, <b key="tiv">{bdt(totalIncome)}</b>],
    [<b key="e">Expenses</b>, ""],
    ...[...expenseByCat.entries()].sort((a, b) => b[1] - a[1]).map(([c, v]) => [`  ${c}`, `− ${bdt(v)}`]),
    [<b key="te">Total expenses</b>, <b key="tev">− {bdt(expenseTotal)}</b>],
    [
      <b key="n" className={net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>Net profit</b>,
      <b key="nv" className={net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>{bdt(net)}</b>,
    ],
  ];

  return (
    <main className="p-5 sm:p-8 max-w-3xl mx-auto print-area">
      <ReportHeader businessName={user.business!.name} title="Profit & Loss" type="pnl" from={range.fromStr} to={range.toStr} />

      <div className="mt-6 grid gap-4 grid-cols-3">
        {[
          { label: "Income", value: bdt(totalIncome), c: "from-emerald-500 to-teal-600" },
          { label: "Expenses", value: bdt(expenseTotal), c: "from-rose-500 to-red-600" },
          { label: "Net profit", value: bdt(net), c: net >= 0 ? "from-violet-500 to-purple-600" : "from-red-500 to-rose-600" },
        ].map((k) => (
          <div key={k.label} className={`rounded-2xl p-5 text-white bg-gradient-to-br ${k.c} shadow-lg`}>
            <div className="text-xl font-bold">{k.value}</div>
            <div className="text-xs text-white/80">{k.label}</div>
          </div>
        ))}
      </div>

      <ReportTable head={["Line", "Amount"]} align={["l", "r"]} rows={rows} />
    </main>
  );
}
