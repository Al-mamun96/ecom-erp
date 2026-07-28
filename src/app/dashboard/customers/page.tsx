import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Filters } from "@/components/Filters";
import { NewCustomer } from "./NewCustomer";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { ctx } = await requireTenant();
  const q = ((await searchParams).q ?? "").trim();

  const where: Prisma.CustomerWhereInput = {
    businessId: ctx.businessId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // aggregate orders per customer (count + spend, excluding cancelled)
  const grouped = await prisma.order.groupBy({
    by: ["customerId"],
    where: { businessId: ctx.businessId, status: { not: "cancelled" }, customerId: { not: null } },
    _count: { _all: true },
    _sum: { total: true },
  });
  const stats = new Map(grouped.map((g) => [g.customerId, g]));

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            {customers.length} customer{customers.length === 1 ? "" : "s"}
          </p>
        </div>
        <NewCustomer />
      </div>

      <div className="mt-4">
        <Filters searchValue={q} searchPlaceholder="Search name or phone…" />
      </div>

      {customers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-12 text-center text-black/50 dark:text-white/50">
          {q ? (
            "No customers match your search."
          ) : (
            <>They&apos;re added automatically when you create orders, or click <b>New customer</b>.</>
          )}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium text-right">Orders</th>
                <th className="px-4 py-3 font-medium text-right">Total spent</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const s = stats.get(c.id);
                return (
                  <tr key={c.id} className="border-t border-black/5 dark:border-white/5">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-black/60 dark:text-white/60">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{s?._count._all ?? 0}</td>
                    <td className="px-4 py-3 text-right font-medium">{bdt(s?._sum.total ?? 0)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/customers/${c.id}`}
                        className="text-indigo-500 hover:underline text-xs"
                      >
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
