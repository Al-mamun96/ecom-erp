import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Filters } from "@/components/Filters";
import { NewSupplier } from "./NewSupplier";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { ctx } = await requireTenant();
  const q = ((await searchParams).q ?? "").trim();

  const where: Prisma.SupplierWhereInput = {
    businessId: ctx.businessId,
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
  };

  const suppliers = await prisma.supplier.findMany({ where, orderBy: { createdAt: "desc" } });

  const grouped = await prisma.purchase.groupBy({
    by: ["supplierId"],
    where: { businessId: ctx.businessId, supplierId: { not: null } },
    _sum: { total: true, amountPaid: true },
    _count: { _all: true },
  });
  const stats = new Map(grouped.map((g) => [g.supplierId, g]));

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-sm text-[var(--muted)]">
            {suppliers.length} supplier{suppliers.length === 1 ? "" : "s"}
          </p>
        </div>
        <NewSupplier />
      </div>

      <div className="mt-4">
        <Filters searchValue={q} searchPlaceholder="Search name or phone…" />
      </div>

      {suppliers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-12 text-center text-[var(--muted)]">
          {q ? "No suppliers match your search." : "No suppliers yet. Click New supplier to add one."}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium text-right">Purchases</th>
                <th className="px-4 py-3 font-medium text-right">Total bought</th>
                <th className="px-4 py-3 font-medium text-right">Due</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const g = stats.get(s.id);
                const total = Number(g?._sum.total ?? 0);
                const paid = Number(g?._sum.amountPaid ?? 0);
                const due = Math.max(0, total - paid);
                return (
                  <tr key={s.id} className="border-t border-black/5 dark:border-white/5">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{s.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{g?._count._all ?? 0}</td>
                    <td className="px-4 py-3 text-right">{bdt(total)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${due > 0 ? "text-rose-500" : ""}`}>
                      {bdt(due)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/suppliers/${s.id}`} className="text-indigo-500 hover:underline text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
