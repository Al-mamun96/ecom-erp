import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRange, bdt } from "@/lib/reports";
import { ReportHeader } from "../ReportHeader";
import { StatGrid, ReportTable, SectionTitle } from "../parts";

export default async function PayrollReport({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { user, ctx } = await requireTenant();
  const range = parseRange(await searchParams);
  const inRange = { gte: range.from, lte: range.to };

  const payments = await prisma.salaryPayment.findMany({
    where: { businessId: ctx.businessId, paidAt: inRange },
    include: { employee: true },
    orderBy: { paidAt: "desc" },
  });

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  const byEmployee = new Map<string, number>();
  for (const p of payments) byEmployee.set(p.employee.name, (byEmployee.get(p.employee.name) ?? 0) + Number(p.amount));

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto print-area">
      <ReportHeader businessName={user.business!.name} title="Payroll report" type="payroll" from={range.fromStr} to={range.toStr} />

      <StatGrid
        stats={[
          { label: "Total paid", value: bdt(total) },
          { label: "Payments", value: `${payments.length}` },
          { label: "Staff paid", value: `${byEmployee.size}` },
        ]}
      />

      <SectionTitle>By employee</SectionTitle>
      <ReportTable
        head={["Employee", "Total paid"]}
        align={["l", "r"]}
        rows={[...byEmployee.entries()].sort((a, b) => b[1] - a[1]).map(([n, v]) => [n, bdt(v)])}
      />

      <SectionTitle>Payments</SectionTitle>
      <ReportTable
        head={["Paid on", "Employee", "For month", "Note", "Amount"]}
        align={["l", "l", "l", "l", "r"]}
        rows={payments.map((p) => [
          p.paidAt.toISOString().slice(0, 10),
          p.employee.name,
          p.forMonth,
          p.note ?? "—",
          bdt(p.amount),
        ])}
      />
    </main>
  );
}
