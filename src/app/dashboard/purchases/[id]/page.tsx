import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await requireTenant();

  const purchase = await prisma.purchase.findFirst({
    where: { id, businessId: ctx.businessId },
    include: { supplier: true, items: true },
  });
  if (!purchase) notFound();

  const due = Math.max(0, Number(purchase.total) - Number(purchase.amountPaid));

  return (
    <main className="p-5 sm:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard/purchases" className="text-sm text-[var(--muted)]">
        ← Purchases
      </Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{purchase.code}</h1>
        <span className="text-sm text-[var(--muted)]">{purchase.date.toISOString().slice(0, 10)}</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface)] p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Supplier</div>
          <div className="mt-2 font-medium">
            {purchase.supplier ? (
              <Link href={`/dashboard/suppliers/${purchase.supplier.id}`} className="text-indigo-500 hover:underline">
                {purchase.supplier.name}
              </Link>
            ) : (
              "—"
            )}
          </div>
          {purchase.note && <p className="mt-1 text-sm text-[var(--muted)]">{purchase.note}</p>}
        </div>
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface)] p-5 text-sm space-y-1">
          <Row label="Total" value={bdt(purchase.total)} bold />
          <Row label="Paid" value={bdt(purchase.amountPaid)} />
          <Row label="Due" value={bdt(due)} danger={due > 0} />
          <div className="pt-1">
            <span className="text-xs rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10 capitalize">
              {purchase.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium text-right">Unit cost</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {purchase.items.map((it) => (
              <tr key={it.id} className="border-t border-black/5 dark:border-white/5">
                <td className="px-4 py-3">{it.name}</td>
                <td className="px-4 py-3 text-right">{bdt(it.cost)}</td>
                <td className="px-4 py-3 text-right">{it.qty}</td>
                <td className="px-4 py-3 text-right font-medium">{bdt(Number(it.cost) * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Row({ label, value, bold, danger }: { label: string; value: string; bold?: boolean; danger?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-[var(--muted)]">{label}</span>
      <span className={danger ? "text-rose-500 font-medium" : ""}>{value}</span>
    </div>
  );
}
