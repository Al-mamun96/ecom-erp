"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const schema = z.object({ planId: z.string().min(1) });

export type BillingState = { error?: string; ok?: boolean; message?: string };

/**
 * Manual-gateway upgrade request: creates a DUE invoice for the chosen plan.
 * A super-admin marks it paid, which activates the subscription.
 */
export async function requestPlanAction(
  _prev: BillingState,
  formData: FormData,
): Promise<BillingState> {
  const { ctx } = await requireTenant();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid plan" };

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan || plan.slug === "trial") return { error: "Choose a paid plan" };

  const sub = await prisma.subscription.findUnique({ where: { businessId: ctx.businessId } });

  // Avoid duplicate open requests for the same plan.
  const existing = await prisma.invoice.findFirst({
    where: { businessId: ctx.businessId, status: "due", gatewayRef: `req:${plan.slug}` },
  });
  if (existing) {
    return { ok: true, message: `You already have a pending request for ${plan.name}.` };
  }

  await prisma.invoice.create({
    data: {
      businessId: ctx.businessId,
      subscriptionId: sub?.id ?? null,
      amount: plan.price as unknown as Prisma.Decimal,
      status: "due",
      gatewayRef: `req:${plan.slug}`,
    },
  });

  revalidatePath("/dashboard/billing");
  return { ok: true, message: `Request for ${plan.name} created. Pay via bKash/bank; we'll activate it.` };
}
