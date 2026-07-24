"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSteadfastCreds } from "@/lib/courier";
import { createParcel, statusByConsignment } from "@/lib/steadfast";

export type CourierState = { error?: string; ok?: boolean; message?: string };

/** Send an order to Steadfast and store the consignment id / tracking / status. */
export async function sendToSteadfastAction(
  _prev: CourierState,
  formData: FormData,
): Promise<CourierState> {
  const { ctx } = await requireTenant();
  const orderId = String(formData.get("orderId") ?? "");

  const creds = await getSteadfastCreds(ctx.businessId);
  if (!creds) return { error: "Add your Steadfast API keys in Settings first" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId: ctx.businessId },
    include: { customer: true },
  });
  if (!order) return { error: "Order not found" };
  if (order.courierRef) return { error: "Already sent to courier" };
  if (!order.customer?.phone || !order.customer?.address) {
    return { error: "Customer needs a phone and address" };
  }

  try {
    const result = await createParcel(creds, {
      invoice: order.code,
      recipientName: order.customer.name,
      recipientPhone: order.customer.phone,
      recipientAddress: order.customer.address,
      codAmount: order.paymentMethod === "cod" ? Number(order.total) : 0,
      note: order.note ?? undefined,
    });

    await prisma.order.updateMany({
      where: { id: order.id, businessId: ctx.businessId },
      data: {
        courier: "steadfast",
        courierRef: result.consignmentId,
        courierTracking: result.trackingCode,
        courierStatus: result.status,
        status: order.status === "pending" ? "shipped" : order.status,
      },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Courier request failed" };
  }

  revalidatePath("/dashboard/courier");
  revalidatePath("/dashboard/orders");
  return { ok: true, message: `Sent ${order.code} to Steadfast` };
}

/** Pull the latest delivery status from Steadfast for one order. */
export async function refreshStatusAction(formData: FormData) {
  const { ctx } = await requireTenant();
  const orderId = String(formData.get("orderId") ?? "");

  const creds = await getSteadfastCreds(ctx.businessId);
  if (!creds) return;

  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId: ctx.businessId },
    select: { id: true, courierRef: true },
  });
  if (!order?.courierRef) return;

  try {
    const status = await statusByConsignment(creds, order.courierRef);
    await prisma.order.updateMany({
      where: { id: order.id, businessId: ctx.businessId },
      data: { courierStatus: status },
    });
  } catch {
    // ignore transient courier errors
  }

  revalidatePath("/dashboard/courier");
}
