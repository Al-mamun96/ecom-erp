import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await requireTenant();

  const supplier = await prisma.supplier.findFirst({
    where: { id, businessId: ctx.businessId },
    include: { purchases: { orderBy: { date: "desc" }, include: { items: true } } },
  });
  if (!supplier) notFound();

  const total = supplier.purchases.reduce((s, p) => s + Number(p.total), 0);
  const paid = supplier.purchases.reduce((s, p) => s + Number(p.amountPaid), 0);
  const due = Math.max(0, total - paid);

  return (
    <main className="p-5 sm:p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/suppliers" className="text-sm text-[var(--muted)]">
        ← Suppliers
      </Link>

      <div className="mt-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface)] p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-semibold">
            {supplier.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{supplier.name}</h1>
            <p className="text-sm text-[var(--muted)]">{supplier.phone ?? "No phone"}</p>
            {supplier.address && <p className="text-sm text-[var(--muted)] mt-0.5">{supplier.address}</p>}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Total bought", value: bdt(total) },
            { label: "Paid", value: bdt(paid) },
            { label: "Due", value: bdt(due) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-black/[.03] dark:bg-white/[.04] p-3">
              <div className={`text-lg font-bold ${s.label === "Due" && due > 0 ? "text-rose-500" : ""}`}>
                {s.value}
              </div>
              <div className="text-xs text-[var(--muted)]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mt-8 font-semibold">Purchase history</h2>
      {supplier.purchases.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">No purchases yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Items</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {supplier.purchases.map((p) => (
                <tr key={p.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3 font-mono">
                    <Link href={`/dashboard/purchases/${p.id}`} className="text-indigo-500 hover:underline">
                      {p.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{p.date.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right">{p.items.length}</td>
                  <td className="px-4 py-3 text-right font-medium">{bdt(p.total)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10 capitalize">
                      {p.paymentStatus}
                    </span>
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
