import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRange, bdt } from "@/lib/reports";
import { ReportHeader } from "../ReportHeader";
import { StatGrid, ReportTable, SectionTitle } from "../parts";

export default async function SalesReport({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { user, ctx } = await requireTenant();
  const range = parseRange(await searchParams);
  const inRange = { gte: range.from, lte: range.to };

  const orders = await prisma.order.findMany({
    where: { businessId: ctx.businessId, createdAt: inRange },
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  const valid = orders.filter((o) => o.status !== "cancelled");
  const sales = valid.reduce((s, o) => s + Number(o.total), 0);
  const avg = valid.length ? sales / valid.length : 0;
  const cod = valid.filter((o) => o.paymentMethod === "cod").reduce((s, o) => s + Number(o.total), 0);
  const prepaid = sales - cod;

  const byStatus = new Map<string, { count: number; total: number }>();
  for (const o of orders) {
    const c = byStatus.get(o.status) ?? { count: 0, total: 0 };
    c.count++;
    c.total += Number(o.total);
    byStatus.set(o.status, c);
  }

  const byCourier = new Map<string, number>();
  for (const o of valid) {
    const k = o.courier ?? "none";
    byCourier.set(k, (byCourier.get(k) ?? 0) + 1);
  }

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto print-area">
      <ReportHeader businessName={user.business!.name} title="Sales report" type="sales" from={range.fromStr} to={range.toStr} />

      <StatGrid
        stats={[
          { label: "Net sales", value: bdt(sales) },
          { label: "Orders", value: `${valid.length}` },
          { label: "Avg order", value: bdt(Math.round(avg)) },
          { label: "COD / Prepaid", value: `${bdt(cod)} / ${bdt(prepaid)}` },
        ]}
      />

      <SectionTitle>By status</SectionTitle>
      <ReportTable
        head={["Status", "Orders", "Total"]}
        align={["l", "r", "r"]}
        rows={[...byStatus.entries()].map(([s, v]) => [
          <span key={s} className="capitalize">{s}</span>,
          v.count,
          bdt(v.total),
        ])}
      />

      <SectionTitle>By courier</SectionTitle>
      <ReportTable
        head={["Courier", "Orders"]}
        align={["l", "r"]}
        rows={[...byCourier.entries()].map(([c, n]) => [
          <span key={c} className="capitalize">{c}</span>,
          n,
        ])}
      />

      <SectionTitle>Orders</SectionTitle>
      <ReportTable
        head={["Code", "Date", "Customer", "Items", "Payment", "Status", "Total"]}
        align={["l", "l", "l", "r", "l", "l", "r"]}
        rows={orders.map((o) => [
          o.code,
          o.createdAt.toISOString().slice(0, 10),
          o.customer?.name ?? "—",
          o.items.length,
          o.paymentMethod.toUpperCase(),
          <span key={o.id} className="capitalize">{o.status}</span>,
          bdt(o.total),
        ])}
      />
    </main>
  );
}
