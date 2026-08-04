import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Filters } from "@/components/Filters";
import { AdjustStock } from "./AdjustStock";

const bdt = (n: number) => "৳" + Math.round(n).toLocaleString("en-US");

const reasonColor: Record<string, string> = {
  purchase: "text-emerald-600 dark:text-emerald-400",
  sale: "text-blue-600 dark:text-blue-400",
  adjustment: "text-amber-600 dark:text-amber-400",
  cancel: "text-violet-600 dark:text-violet-400",
  return: "text-orange-600 dark:text-orange-400",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stock?: string }>;
}) {
  const { ctx } = await requireTenant();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const stockFilter = sp.stock;

  const where: Prisma.ProductWhereInput = {
    businessId: ctx.businessId,
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : {}),
    ...(stockFilter === "out" ? { stock: { lte: 0 } } : {}),
    ...(stockFilter === "low" ? { stock: { gt: 0, lt: 5 } } : {}),
  };

  const [products, allProducts, movements] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { stock: "asc" } }),
    prisma.product.findMany({ where: { businessId: ctx.businessId }, select: { stock: true, cost: true } }),
    prisma.stockMovement.findMany({
      where: { businessId: ctx.businessId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const stockValue = allProducts.reduce((s, p) => s + p.stock * Number(p.cost), 0);
  const units = allProducts.reduce((s, p) => s + p.stock, 0);
  const lowCount = allProducts.filter((p) => p.stock > 0 && p.stock < 5).length;
  const outCount = allProducts.filter((p) => p.stock <= 0).length;

  const kpis = [
    { label: "Stock value (at cost)", value: bdt(stockValue) },
    { label: "Total units", value: `${units}` },
    { label: "Low stock", value: `${lowCount}` },
    { label: "Out of stock", value: `${outCount}` },
  ];

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-[var(--muted)]">Stock levels, value and movements</p>
        </div>
        <Link
          href="/dashboard/purchases/new"
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/25 hover:opacity-95"
        >
          + Purchase stock
        </Link>
      </div>

      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface)] p-4 shadow-sm">
            <div className="text-xl font-bold tracking-tight">{k.value}</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Filters
          searchValue={q}
          searchPlaceholder="Search product or SKU…"
          selects={[
            {
              name: "stock",
              value: stockFilter ?? "",
              options: [
                { value: "", label: "All stock" },
                { value: "low", label: "Low (<5)" },
                { value: "out", label: "Out of stock" },
              ],
            },
          ]}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium text-right">Cost</th>
              <th className="px-4 py-3 font-medium text-right">Stock</th>
              <th className="px-4 py-3 font-medium text-right">Value</th>
              <th className="px-4 py-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-black/5 dark:border-white/5">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/dashboard/products/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">{p.sku ?? "—"}</td>
                <td className="px-4 py-3 text-right">{bdt(Number(p.cost))}</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.stock <= 0
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : p.stock < 5
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{bdt(p.stock * Number(p.cost))}</td>
                <td className="px-4 py-3 text-right">
                  <AdjustStock productId={p.id} name={p.name} stock={p.stock} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-semibold">Recent stock movements</h2>
      {movements.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">No movements yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3 text-[var(--muted)]">{m.createdAt.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3">{m.product.name}</td>
                  <td className={`px-4 py-3 capitalize ${reasonColor[m.reason] ?? ""}`}>{m.reason}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">{m.reference ?? m.note ?? "—"}</td>
                  <td className={`px-4 py-3 text-right font-medium ${m.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {m.delta > 0 ? "+" : ""}
                    {m.delta}
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
