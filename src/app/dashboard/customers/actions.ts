"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2, "Enter the customer's name").max(80),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
});

export type CustomerFormState = { error?: string; ok?: boolean };

export async function createCustomerAction(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const { ctx } = await requireTenant();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const d = parsed.data;
  await prisma.customer.create({
    data: {
      businessId: ctx.businessId,
      name: d.name,
      phone: d.phone || null,
      address: d.address || null,
      note: d.note || null,
    },
  });

  revalidatePath("/dashboard/customers");
  return { ok: true };
}

export async function updateCustomerAction(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const { ctx } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const d = parsed.data;
  await prisma.customer.updateMany({
    where: { id, businessId: ctx.businessId },
    data: {
      name: d.name,
      phone: d.phone || null,
      address: d.address || null,
      note: d.note || null,
    },
  });

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  return { ok: true };
}
