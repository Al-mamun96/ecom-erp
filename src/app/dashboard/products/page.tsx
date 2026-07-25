import type { Prisma } from "@prisma/client";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Filters } from "@/components/Filters";
import { ProductsClient, type ProductDTO } from "./ProductsClient";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stock?: string }>;
}) {
  const { ctx } = await requireTenant();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const stockFilter = sp.stock; // "low" | "out"

  const where: Prisma.ProductWhereInput = {
    businessId: ctx.businessId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(stockFilter === "out" ? { stock: { lte: 0 } } : {}),
    ...(stockFilter === "low" ? { stock: { gt: 0, lt: 5 } } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const dto: ProductDTO[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
    cost: Number(p.cost),
    stock: p.stock,
  }));

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          Your catalog — {dto.length} item{dto.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mb-4">
        <Filters
          searchValue={q}
          searchPlaceholder="Search name or SKU…"
          selects={[
            {
              name: "stock",
              value: stockFilter ?? "",
              options: [
                { value: "", label: "All stock" },
                { value: "low", label: "Low stock (<5)" },
                { value: "out", label: "Out of stock" },
              ],
            },
          ]}
        />
      </div>

      <ProductsClient products={dto} />
    </main>
  );
}
