"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  productId: z.string().min(1),
  delta: z.coerce.number().int().refine((n) => n !== 0, "Enter a non-zero quantity"),
  note: z.string().max(200).optional().or(z.literal("")),
});

export type AdjustState = { error?: string; ok?: boolean };

/** Manually adjust a product's stock (+/-) and log the movement. */
export async function adjustStockAction(_prev: AdjustState, formData: FormData): Promise<AdjustState> {
  const { ctx } = await requireTenant();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  const { productId, delta, note } = parsed.data;

  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: ctx.businessId },
  });
  if (!product) return { error: "Product not found" };
  if (product.stock + delta < 0) return { error: "Adjustment would make stock negative" };

  await prisma.$transaction(async (tx) => {
    await tx.product.updateMany({
      where: { id: productId, businessId: ctx.businessId },
      data: { stock: { increment: delta } },
    });
    await tx.stockMovement.create({
      data: {
        businessId: ctx.businessId,
        productId,
        delta,
        reason: "adjustment",
        note: note || null,
      },
    });
  });

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/products");
  return { ok: true };
}
