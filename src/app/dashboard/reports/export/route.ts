import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.businessId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { businessId: user.businessId },
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Code",
    "Date",
    "Customer",
    "Phone",
    "Items",
    "Subtotal",
    "Delivery",
    "Discount",
    "Total",
    "Payment",
    "Courier",
    "Status",
  ];

  const rows = orders.map((o) =>
    [
      o.code,
      o.createdAt.toISOString().slice(0, 10),
      o.customer?.name ?? "",
      o.customer?.phone ?? "",
      o.items.length,
      Number(o.subtotal),
      Number(o.deliveryFee),
      Number(o.discount),
      Number(o.total),
      o.paymentMethod,
      o.courier ?? "",
      o.status,
    ]
      .map(csvCell)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${date}.csv"`,
    },
  });
}
