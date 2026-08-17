"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

/** Mark a "due" plan-request invoice paid and activate that plan for the tenant. */
export async function activateInvoiceAction(formData: FormData) {
  await requireAdmin();
  const invoiceId = String(formData.get("invoiceId") ?? "");

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;

  const slug = invoice.gatewayRef?.replace("req:", "");
  const plan = slug ? await prisma.plan.findUnique({ where: { slug } }) : null;

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "paid", paidAt: new Date() },
    });
    if (plan) {
      const now = new Date();
      await tx.subscription.updateMany({
        where: { businessId: invoice.businessId },
        data: {
          planId: plan.id,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: addMonths(now, 1),
          trialEndsAt: null,
          gateway: "manual",
        },
      });
    }
  });

  revalidatePath("/admin");
}

const setSchema = z.object({
  businessId: z.string().min(1),
  planId: z.string().min(1),
  status: z.enum(["trialing", "active", "past_due", "canceled"]),
});

/** Directly set a tenant's plan + status. */
export async function setSubscriptionAction(formData: FormData) {
  await requireAdmin();
  const parsed = setSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { businessId, planId, status } = parsed.data;

  const now = new Date();
  await prisma.subscription.updateMany({
    where: { businessId },
    data: {
      planId,
      status,
      ...(status === "active"
        ? { currentPeriodStart: now, currentPeriodEnd: addMonths(now, 1), trialEndsAt: null }
        : {}),
    },
  });

  revalidatePath("/admin");
}

/** Assign (or clear) a tenant's custom domain/subdomain. */
export async function setHostnameAction(formData: FormData) {
  await requireAdmin();
  const businessId = String(formData.get("businessId") ?? "");
  const raw = String(formData.get("hostname") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const hostname = raw || null;

  // hostname is unique — free it from any other business first
  if (hostname) {
    await prisma.business.updateMany({
      where: { hostname, NOT: { id: businessId } },
      data: { hostname: null },
    });
  }
  await prisma.business.update({ where: { id: businessId }, data: { hostname } });
  revalidatePath("/admin");
}

/** Reset the tenant's current-month order meter to 0. */
export async function resetMeterAction(formData: FormData) {
  await requireAdmin();
  const businessId = String(formData.get("businessId") ?? "");
  await prisma.usageCounter.updateMany({
    where: { businessId, period: currentPeriod() },
    data: { ordersUsed: 0 },
  });
  revalidatePath("/admin");
}
