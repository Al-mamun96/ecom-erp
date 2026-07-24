"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1, "Enter a product name").max(120),
  sku: z.string().max(60).optional().or(z.literal("")),
  price: z.coerce.number().min(0).default(0),
  cost: z.coerce.number().min(0).default(0),
  stock: z.coerce.number().int().default(0),
});

export type ProductFormState = { error?: string; ok?: boolean };

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { ctx } = await requireTenant();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const d = parsed.data;
  await prisma.product.create({
    data: {
      businessId: ctx.businessId,
      name: d.name,
      sku: d.sku || null,
      price: d.price as unknown as Prisma.Decimal,
      cost: d.cost as unknown as Prisma.Decimal,
      stock: d.stock,
    },
  });

  revalidatePath("/dashboard/products");
  return { ok: true };
}

export async function updateProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { ctx } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const d = parsed.data;
  await prisma.product.updateMany({
    where: { id, businessId: ctx.businessId },
    data: {
      name: d.name,
      sku: d.sku || null,
      price: d.price as unknown as Prisma.Decimal,
      cost: d.cost as unknown as Prisma.Decimal,
      stock: d.stock,
    },
  });

  revalidatePath("/dashboard/products");
  return { ok: true };
}

export async function deleteProductAction(formData: FormData) {
  const { ctx } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  await prisma.product.deleteMany({ where: { id, businessId: ctx.businessId } });
  revalidatePath("/dashboard/products");
}
