import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintTrigger } from "./PrintTrigger";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

// Standalone printable invoice — no dashboard chrome. Light-only for clean paper.
export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, ctx } = await requireTenant();
  const business = user.business!;

  const order = await prisma.order.findFirst({
    where: { id, businessId: ctx.businessId },
    include: { customer: true, items: true },
  });
  if (!order) notFound();

  return (
    <div className="min-h-screen bg-white text-black">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 16mm; }
        }
      `}</style>

      <div className="mx-auto max-w-2xl px-8 py-10">
        <PrintTrigger />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-black/10 pb-5">
          <div>
            <h1 className="text-2xl font-bold">{business.name}</h1>
            {business.phone && <div className="text-sm text-black/60">{business.phone}</div>}
            {business.address && <div className="text-sm text-black/60">{business.address}</div>}
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">INVOICE</div>
            <div className="text-sm text-black/60">{order.code}</div>
            <div className="text-sm text-black/60">{order.createdAt.toISOString().slice(0, 10)}</div>
          </div>
        </div>

        {/* Bill to */}
        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="font-semibold text-black/50 uppercase text-xs">Bill to</div>
            <div className="mt-1 font-medium">{order.customer?.name ?? "Walk-in customer"}</div>
            {order.customer?.phone && <div className="text-black/70">{order.customer.phone}</div>}
            {order.customer?.address && <div className="text-black/70">{order.customer.address}</div>}
          </div>
          <div className="text-right">
            <div className="font-semibold text-black/50 uppercase text-xs">Payment</div>
            <div className="mt-1">{order.paymentMethod.toUpperCase()}</div>
            {order.courier && <div className="text-black/70 capitalize">via {order.courier}</div>}
            {order.courierRef && <div className="text-black/60 text-xs">CN: {order.courierRef}</div>}
          </div>
        </div>

        {/* Items */}
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black/20 text-left">
              <th className="py-2 font-semibold">Item</th>
              <th className="py-2 font-semibold text-right">Price</th>
              <th className="py-2 font-semibold text-right">Qty</th>
              <th className="py-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-b border-black/10">
                <td className="py-2">{it.name}</td>
                <td className="py-2 text-right">{bdt(it.price)}</td>
                <td className="py-2 text-right">{it.qty}</td>
                <td className="py-2 text-right">{bdt(Number(it.price) * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 ml-auto w-56 text-sm">
          <Line label="Subtotal" value={bdt(order.subtotal)} />
          <Line label="Delivery" value={bdt(order.deliveryFee)} />
          <Line label="Discount" value={`− ${bdt(order.discount)}`} />
          <div className="mt-1 border-t border-black/20 pt-1">
            <Line label="Total" value={bdt(order.total)} bold />
          </div>
          {order.paymentMethod === "cod" && (
            <div className="mt-2 rounded bg-black/5 px-2 py-1 text-center font-medium">
              COD to collect: {bdt(order.total)}
            </div>
          )}
        </div>

        {order.note && (
          <div className="mt-6 text-sm">
            <span className="font-semibold">Note: </span>
            {order.note}
          </div>
        )}

        <div className="mt-10 text-center text-xs text-black/40">
          Thank you for your order — {business.name}
        </div>
      </div>
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 ${bold ? "font-bold text-base" : ""}`}>
      <span className="text-black/60">{label}</span>
      <span>{value}</span>
    </div>
  );
}
