import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRange, bdt } from "@/lib/reports";
import { ReportHeader } from "../ReportHeader";
import { StatGrid, ReportTable, SectionTitle } from "../parts";

export default async function ExpenseReport({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { user, ctx } = await requireTenant();
  const range = parseRange(await searchParams);
  const inRange = { gte: range.from, lte: range.to };

  const expenses = await prisma.transaction.findMany({
    where: { businessId: ctx.businessId, type: "expense", date: inRange },
    orderBy: { date: "desc" },
  });

  const total = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const byCat = new Map<string, number>();
  for (const t of expenses) byCat.set(t.category, (byCat.get(t.category) ?? 0) + Number(t.amount));
  const topCat = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto print-area">
      <ReportHeader businessName={user.business!.name} title="Expense report" type="expense" from={range.fromStr} to={range.toStr} />

      <StatGrid
        stats={[
          { label: "Total expense", value: bdt(total) },
          { label: "Entries", value: `${expenses.length}` },
          { label: "Categories", value: `${byCat.size}` },
          { label: "Top category", value: topCat ? `${topCat[0]}` : "—" },
        ]}
      />

      <SectionTitle>Expense by category</SectionTitle>
      <ReportTable
        head={["Category", "Amount", "Share"]}
        align={["l", "r", "r"]}
        rows={[...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([c, v]) => [
          c,
          bdt(v),
          total ? `${Math.round((v / total) * 100)}%` : "0%",
        ])}
      />

      <SectionTitle>Expense entries</SectionTitle>
      <ReportTable
        head={["Date", "Category", "Note", "Amount"]}
        align={["l", "l", "l", "r"]}
        rows={expenses.map((t) => [
          t.date.toISOString().slice(0, 10),
          t.category,
          t.note ?? "—",
          bdt(t.amount),
        ])}
      />
    </main>
  );
}
