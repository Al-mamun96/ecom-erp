"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2, "Enter the supplier's name").max(80),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
});

export type SupplierFormState = { error?: string; ok?: boolean };

export async function createSupplierAction(
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const { ctx } = await requireTenant();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const d = parsed.data;
  await prisma.supplier.create({
    data: {
      businessId: ctx.businessId,
      name: d.name,
      phone: d.phone || null,
      address: d.address || null,
      note: d.note || null,
    },
  });

  revalidatePath("/dashboard/suppliers");
  return { ok: true };
}

export async function updateSupplierAction(
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const { ctx } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const d = parsed.data;
  await prisma.supplier.updateMany({
    where: { id, businessId: ctx.businessId },
    data: {
      name: d.name,
      phone: d.phone || null,
      address: d.address || null,
      note: d.note || null,
    },
  });

  revalidatePath("/dashboard/suppliers");
  revalidatePath(`/dashboard/suppliers/${id}`);
  return { ok: true };
}

export async function deleteSupplierAction(formData: FormData) {
  const { ctx } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  await prisma.supplier.deleteMany({ where: { id, businessId: ctx.businessId } });
  revalidatePath("/dashboard/suppliers");
}
