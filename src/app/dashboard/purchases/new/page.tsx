import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PurchaseForm } from "./PurchaseForm";

export default async function NewPurchasePage() {
  const { ctx } = await requireTenant();

  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: ctx.businessId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, cost: true, stock: true },
    }),
    prisma.supplier.findMany({
      where: { businessId: ctx.businessId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="p-5 sm:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard/purchases" className="text-sm text-[var(--muted)]">
        ← Purchases
      </Link>
      <h1 className="mt-1 text-2xl font-bold">New purchase</h1>
      <PurchaseForm
        products={products.map((p) => ({ id: p.id, name: p.name, cost: Number(p.cost), stock: p.stock }))}
        suppliers={suppliers}
      />
    </main>
  );
}
