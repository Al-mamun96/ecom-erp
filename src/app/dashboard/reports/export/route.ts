import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRange, toCsv, csvResponse } from "@/lib/reports";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user?.businessId) return new Response("Unauthorized", { status: 401 });
  const businessId = user.businessId;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "orders";
  const range = parseRange({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });
  const inRange = { gte: range.from, lte: range.to };
  const stamp = `${range.fromStr}_${range.toStr}`;
  const n = (v: unknown) => Number(v);

  switch (type) {
    case "sales":
    case "orders": {
      const orders = await prisma.order.findMany({
        where: { businessId, createdAt: inRange },
        include: { customer: true, items: true },
        orderBy: { createdAt: "desc" },
      });
      const csv = toCsv(
        ["Code", "Date", "Customer", "Phone", "Items", "Subtotal", "Delivery", "Discount", "Total", "Payment", "Courier", "Status"],
        orders.map((o) => [
          o.code,
          o.createdAt.toISOString().slice(0, 10),
          o.customer?.name ?? "",
          o.customer?.phone ?? "",
          o.items.length,
          n(o.subtotal),
          n(o.deliveryFee),
          n(o.discount),
          n(o.total),
          o.paymentMethod,
          o.courier ?? "",
          o.status,
        ]),
      );
      return csvResponse(`${type}_${stamp}.csv`, csv);
    }

    case "income":
    case "expense": {
      const txns = await prisma.transaction.findMany({
        where: { businessId, type, date: inRange },
        orderBy: { date: "desc" },
      });
      const csv = toCsv(
        ["Date", "Type", "Category", "Note", "Amount"],
        txns.map((t) => [t.date.toISOString().slice(0, 10), t.type, t.category, t.note ?? "", n(t.amount)]),
      );
      return csvResponse(`${type}_${stamp}.csv`, csv);
    }

    case "pnl": {
      const [salesAgg, txns] = await Promise.all([
        prisma.order.aggregate({
          where: { businessId, status: { not: "cancelled" }, createdAt: inRange },
          _sum: { total: true },
        }),
        prisma.transaction.findMany({ where: { businessId, date: inRange }, select: { type: true, amount: true } }),
      ]);
      const orderSales = n(salesAgg._sum.total ?? 0);
      const otherIncome = txns.filter((t) => t.type === "income").reduce((s, t) => s + n(t.amount), 0);
      const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + n(t.amount), 0);
      const csv = toCsv(
        ["Line", "Amount"],
        [
          ["Order sales", orderSales],
          ["Other income", otherIncome],
          ["Total income", orderSales + otherIncome],
          ["Expenses", -expense],
          ["Net profit", orderSales + otherIncome - expense],
        ],
      );
      return csvResponse(`profit_loss_${stamp}.csv`, csv);
    }

    case "payroll": {
      const payments = await prisma.salaryPayment.findMany({
        where: { businessId, paidAt: inRange },
        include: { employee: true },
        orderBy: { paidAt: "desc" },
      });
      const csv = toCsv(
        ["Paid on", "Employee", "For month", "Note", "Amount"],
        payments.map((p) => [
          p.paidAt.toISOString().slice(0, 10),
          p.employee.name,
          p.forMonth,
          p.note ?? "",
          n(p.amount),
        ]),
      );
      return csvResponse(`payroll_${stamp}.csv`, csv);
    }

    default:
      return new Response("Unknown report type", { status: 400 });
  }
}
