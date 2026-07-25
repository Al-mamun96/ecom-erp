import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await requireTenant();

  const product = await prisma.product.findFirst({
    where: { id, businessId: ctx.businessId },
  });
  if (!product) notFound();

  const soldItems = await prisma.orderItem.findMany({
    where: { productId: id, order: { businessId: ctx.businessId, status: { not: "cancelled" } } },
    include: { order: { include: { customer: true } } },
    orderBy: { order: { createdAt: "desc" } },
  });

  const qtySold = soldItems.reduce((s, i) => s + i.qty, 0);
  const revenue = soldItems.reduce((s, i) => s + i.qty * Number(i.price), 0);
  const price = Number(product.price);
  const cost = Number(product.cost);
  const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

  const stats = [
    { label: "Stock", value: `${product.stock}` },
    { label: "Units sold", value: `${qtySold}` },
    { label: "Revenue", value: bdt(revenue) },
    { label: "Margin", value: `${margin}%` },
  ];

  return (
    <main className="p-5 sm:p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/products" className="text-sm text-black/50 dark:text-white/50">
        ← Products
      </Link>

      <div className="mt-3 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{product.name}</h1>
            <p className="text-sm text-black/50 dark:text-white/50">{product.sku ?? "No SKU"}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{bdt(price)}</div>
            <div className="text-xs text-black/50 dark:text-white/50">cost {bdt(cost)}</div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-black/[.03] dark:bg-white/[.04] p-3">
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-xs text-black/50 dark:text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
        {product.stock <= 0 && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">⚠️ Out of stock.</p>
        )}
      </div>

      <h2 className="mt-8 font-semibold">Sales history</h2>
      {soldItems.length === 0 ? (
        <p className="mt-3 text-sm text-black/50 dark:text-white/50">Not sold yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {soldItems.map((i) => (
                <tr key={i.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3 font-mono">
                    <Link href={`/dashboard/orders/${i.orderId}`} className="text-indigo-500 hover:underline">
                      {i.order.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-black/60 dark:text-white/60">
                    {i.order.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">{i.order.customer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{i.qty}</td>
                  <td className="px-4 py-3 text-right font-medium">{bdt(i.qty * Number(i.price))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
