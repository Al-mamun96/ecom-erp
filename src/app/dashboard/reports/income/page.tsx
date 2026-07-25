import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRange, bdt } from "@/lib/reports";
import { ReportHeader } from "../ReportHeader";
import { StatGrid, ReportTable, SectionTitle } from "../parts";

export default async function IncomeReport({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { user, ctx } = await requireTenant();
  const range = parseRange(await searchParams);
  const inRange = { gte: range.from, lte: range.to };

  const [salesAgg, incomeTxns] = await Promise.all([
    prisma.order.aggregate({
      where: { businessId: ctx.businessId, status: { not: "cancelled" }, createdAt: inRange },
      _sum: { total: true },
    }),
    prisma.transaction.findMany({
      where: { businessId: ctx.businessId, type: "income", date: inRange },
      orderBy: { date: "desc" },
    }),
  ]);

  const orderSales = Number(salesAgg._sum.total ?? 0);
  const otherIncome = incomeTxns.reduce((s, t) => s + Number(t.amount), 0);

  const byCat = new Map<string, number>();
  byCat.set("Order sales", orderSales);
  for (const t of incomeTxns) byCat.set(t.category, (byCat.get(t.category) ?? 0) + Number(t.amount));

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto print-area">
      <ReportHeader businessName={user.business!.name} title="Income report" type="income" from={range.fromStr} to={range.toStr} />

      <StatGrid
        stats={[
          { label: "Order sales", value: bdt(orderSales) },
          { label: "Other income", value: bdt(otherIncome) },
          { label: "Total income", value: bdt(orderSales + otherIncome) },
          { label: "Income entries", value: `${incomeTxns.length}` },
        ]}
      />

      <SectionTitle>Income by category</SectionTitle>
      <ReportTable
        head={["Category", "Amount"]}
        align={["l", "r"]}
        rows={[...byCat.entries()].filter(([, v]) => v > 0).map(([c, v]) => [c, bdt(v)])}
      />

      <SectionTitle>Other income entries</SectionTitle>
      <ReportTable
        head={["Date", "Category", "Note", "Amount"]}
        align={["l", "l", "l", "r"]}
        rows={incomeTxns.map((t) => [
          t.date.toISOString().slice(0, 10),
          t.category,
          t.note ?? "—",
          bdt(t.amount),
        ])}
        empty="No manual income entries in this range (order sales counted above)."
      />
    </main>
  );
}
