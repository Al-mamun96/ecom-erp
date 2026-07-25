import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { StatusSelect } from "../StatusSelect";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

const statusColor: Record<string, string> = {
  pending: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300",
  confirmed: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  processing: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  shipped: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  returned: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  cancelled: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await requireTenant();

  const order = await prisma.order.findFirst({
    where: { id, businessId: ctx.businessId },
    include: { customer: true, items: true },
  });
  if (!order) notFound();

  return (
    <main className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/orders" className="text-sm text-black/50 dark:text-white/50">
            ← Orders
          </Link>
          <h1 className="mt-1 text-2xl font-bold flex items-center gap-3">
            {order.code}
            <span className={`text-xs rounded-full px-2 py-0.5 ${statusColor[order.status]}`}>
              {order.status}
            </span>
          </h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            {order.createdAt.toISOString().slice(0, 10)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusSelect id={order.id} status={order.status} className={statusColor[order.status]} />
          <a
            href={`/print/order/${order.id}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-black/15 dark:border-white/20 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Icon name="chart" width={16} height={16} /> Print invoice
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card title="Customer">
          {order.customer ? (
            <>
              <div className="font-medium">{order.customer.name}</div>
              <div className="text-sm text-black/60 dark:text-white/60">{order.customer.phone ?? "—"}</div>
              {order.customer.address && (
                <div className="text-sm text-black/50 dark:text-white/50 mt-1">{order.customer.address}</div>
              )}
              <Link
                href={`/dashboard/customers/${order.customer.id}`}
                className="mt-2 inline-block text-xs text-indigo-500 hover:underline"
              >
                View customer →
              </Link>
            </>
          ) : (
            <span className="text-black/40 dark:text-white/40">Walk-in / no customer</span>
          )}
        </Card>

        <Card title="Shipping & payment">
          <Row label="Payment" value={order.paymentMethod.toUpperCase()} />
          <Row label="Courier" value={order.courier ? order.courier : "—"} />
          {order.courierRef && <Row label="Consignment" value={order.courierRef} />}
          {order.courierStatus && <Row label="Courier status" value={order.courierStatus} />}
          {order.note && <Row label="Note" value={order.note} />}
        </Card>
      </div>

      {/* Items */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950">
        <table className="w-full text-sm">
          <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-t border-black/5 dark:border-white/5">
                <td className="px-4 py-3">{it.name}</td>
                <td className="px-4 py-3 text-right">{bdt(it.price)}</td>
                <td className="px-4 py-3 text-right">{it.qty}</td>
                <td className="px-4 py-3 text-right font-medium">{bdt(Number(it.price) * it.qty)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-black/10 dark:border-white/10">
            <FootRow label="Subtotal" value={bdt(order.subtotal)} />
            <FootRow label="Delivery" value={bdt(order.deliveryFee)} />
            <FootRow label="Discount" value={`− ${bdt(order.discount)}`} />
            <FootRow label="Total" value={bdt(order.total)} bold />
          </tfoot>
        </table>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-black/50 dark:text-white/50">{label}</span>
      <span className="capitalize">{value}</span>
    </div>
  );
}

function FootRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr className={bold ? "font-semibold" : ""}>
      <td className="px-4 py-2" colSpan={3}>
        <span className="float-right text-black/60 dark:text-white/60">{label}</span>
      </td>
      <td className="px-4 py-2 text-right">{value}</td>
    </tr>
  );
}
