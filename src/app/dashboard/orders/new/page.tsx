import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { getUsage } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { OrderForm } from "./OrderForm";

export default async function NewOrderPage() {
  const { ctx } = await requireTenant();
  const usage = await getUsage(ctx.businessId);

  // Meter gate at the page level too — block reaching the form when limit is hit.
  if (usage.limit > 0 && usage.remaining === 0) {
    redirect("/dashboard/orders");
  }

  const products = await prisma.product.findMany({
    where: { businessId: ctx.businessId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, price: true, stock: true },
  });
  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    stock: p.stock,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard/orders" className="text-sm text-black/50 dark:text-white/50">
        ← Orders
      </Link>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold">New order</h1>
        <span className="text-sm text-black/50 dark:text-white/50">
          Remaining: {usage.remaining} / {usage.limit}
        </span>
      </div>
      <OrderForm products={productOptions} />
    </main>
  );
}
