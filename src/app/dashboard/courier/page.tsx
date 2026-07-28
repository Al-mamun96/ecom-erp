import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSteadfastCreds } from "@/lib/courier";
import { Filters } from "@/components/Filters";
import { SendButton, RefreshButton } from "./CourierButtons";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

export default async function CourierPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sent?: string }>;
}) {
  const { ctx } = await requireTenant();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const sentFilter = sp.sent; // "yes" | "no"

  const where: Prisma.OrderWhereInput = {
    businessId: ctx.businessId,
    status: { notIn: ["cancelled", "delivered"] },
    ...(sentFilter === "yes" ? { courierRef: { not: null } } : {}),
    ...(sentFilter === "no" ? { courierRef: null } : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { customer: { is: { name: { contains: q, mode: "insensitive" } } } },
            { customer: { is: { phone: { contains: q } } } },
          ],
        }
      : {}),
  };

  const [creds, orders] = await Promise.all([
    getSteadfastCreds(ctx.businessId),
    prisma.order.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const configured = !!creds;

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Courier</h1>
      <p className="text-sm text-black/50 dark:text-white/50">
        Send COD parcels to Steadfast and track delivery status.
      </p>

      <div className="mt-4">
        <Filters
          searchValue={q}
          searchPlaceholder="Search code, customer, phone…"
          selects={[
            {
              name: "sent",
              value: sentFilter ?? "",
              options: [
                { value: "", label: "All" },
                { value: "no", label: "Not sent" },
                { value: "yes", label: "Sent" },
              ],
            },
          ]}
        />
      </div>

      {!configured && (
        <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          ⚠️ Steadfast is not connected.{" "}
          <Link href="/dashboard/settings" className="underline font-medium">
            Add your API keys in Settings
          </Link>{" "}
          to enable sending.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-12 text-center text-black/50 dark:text-white/50">
          No active orders to ship.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium text-right">COD</th>
                <th className="px-4 py-3 font-medium">Consignment</th>
                <th className="px-4 py-3 font-medium">Courier status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const sent = !!o.courierRef;
                const missingContact = !o.customer?.phone || !o.customer?.address;
                return (
                  <tr key={o.id} className="border-t border-black/5 dark:border-white/5">
                    <td className="px-4 py-3 font-mono">{o.code}</td>
                    <td className="px-4 py-3">
                      <div>{o.customer?.name ?? "—"}</div>
                      <div className="text-xs text-black/40 dark:text-white/40">
                        {o.customer?.phone ?? "no phone"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.paymentMethod === "cod" ? bdt(o.total) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {sent ? (
                        <div>
                          <div className="font-mono text-xs">{o.courierRef}</div>
                          {o.courierTracking && (
                            <div className="text-[11px] text-black/40 dark:text-white/40">
                              {o.courierTracking}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-black/30 dark:text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {o.courierStatus ? (
                        <span className="rounded-full px-2 py-0.5 text-xs bg-blue-500/15 text-blue-600 dark:text-blue-400 capitalize">
                          {o.courierStatus.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-black/30 dark:text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        {sent ? (
                          <RefreshButton orderId={o.id} />
                        ) : (
                          <SendButton orderId={o.id} disabled={!configured || missingContact} />
                        )}
                      </div>
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
