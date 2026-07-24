import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductsClient, type ProductDTO } from "./ProductsClient";

export default async function ProductsPage() {
  const { ctx } = await requireTenant();
  const products = await prisma.product.findMany({
    where: { businessId: ctx.businessId },
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
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          Your catalog — {dto.length} item{dto.length === 1 ? "" : "s"}
        </p>
      </div>
      <ProductsClient products={dto} />
    </main>
  );
}
