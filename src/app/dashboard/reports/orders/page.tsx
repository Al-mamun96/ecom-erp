import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRange, bdt } from "@/lib/reports";
import { ReportHeader } from "../ReportHeader";
import { StatGrid, ReportTable, SectionTitle } from "../parts";

export default async function OrdersReport({
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
  const totalValue = valid.reduce((s, o) => s + Number(o.total), 0);
  const delivered = orders.filter((o) => o.status === "delivered").length;

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto print-area">
      <ReportHeader businessName={user.business!.name} title="Orders report" type="orders" from={range.fromStr} to={range.toStr} />

      <StatGrid
        stats={[
          { label: "Orders", value: `${orders.length}` },
          { label: "Valid (non-cancelled)", value: `${valid.length}` },
          { label: "Delivered", value: `${delivered}` },
          { label: "Order value", value: bdt(totalValue) },
        ]}
      />

      <SectionTitle>All orders</SectionTitle>
      <ReportTable
        head={["Code", "Date", "Customer", "Phone", "Items", "Payment", "Courier", "Status", "Total"]}
        align={["l", "l", "l", "l", "r", "l", "l", "l", "r"]}
        rows={orders.map((o) => [
          <Link key={o.id} href={`/dashboard/orders/${o.id}`} className="text-indigo-500 hover:underline">
            {o.code}
          </Link>,
          o.createdAt.toISOString().slice(0, 10),
          o.customer?.name ?? "—",
          o.customer?.phone ?? "—",
          o.items.length,
          o.paymentMethod.toUpperCase(),
          <span key={`${o.id}c`} className="capitalize">{o.courier ?? "—"}</span>,
          <span key={`${o.id}s`} className="capitalize">{o.status}</span>,
          bdt(o.total),
        ])}
      />
    </main>
  );
}
