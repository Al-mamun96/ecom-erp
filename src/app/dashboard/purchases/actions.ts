"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const itemSchema = z.object({
  name: z.string().min(1),
  cost: z.coerce.number().min(0),
  qty: z.coerce.number().int().min(1),
  productId: z.string().optional().nullable(),
});

const schema = z.object({
  supplierId: z.string().optional().or(z.literal("")),
  discount: z.coerce.number().min(0).default(0),
  amountPaid: z.coerce.number().min(0).default(0),
  date: z.string().optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
  items: z.string(),
});

export type PurchaseFormState = { error?: string; ok?: boolean };

export async function createPurchaseAction(
  _prev: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const { ctx } = await requireTenant();

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  let items;
  try {
    items = z.array(itemSchema).min(1, "Add at least one item").parse(JSON.parse(parsed.data.items));
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Item list is invalid" };
  }

  const d = parsed.data;
  const subtotal = items.reduce((s, it) => s + it.cost * it.qty, 0);
  const total = Math.max(0, subtotal - (d.discount || 0));
  const amountPaid = Math.min(d.amountPaid || 0, total);
  const paymentStatus = amountPaid >= total ? "paid" : amountPaid > 0 ? "partial" : "due";
  const when = d.date ? new Date(d.date) : new Date();

  let supplierName = "supplier";
  if (d.supplierId) {
    const sup = await prisma.supplier.findFirst({
      where: { id: d.supplierId, businessId: ctx.businessId },
    });
    if (!sup) return { error: "Supplier not found" };
    supplierName = sup.name;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const count = await tx.purchase.count({ where: { businessId: ctx.businessId } });
      const code = `PUR-${String(count + 1).padStart(4, "0")}`;

      await tx.purchase.create({
        data: {
          businessId: ctx.businessId,
          code,
          supplierId: d.supplierId || null,
          subtotal: subtotal as unknown as Prisma.Decimal,
          discount: (d.discount || 0) as unknown as Prisma.Decimal,
          total: total as unknown as Prisma.Decimal,
          amountPaid: amountPaid as unknown as Prisma.Decimal,
          paymentStatus,
          note: d.note || null,
          date: when,
          items: {
            create: items.map((it) => ({
              productId: it.productId ?? null,
              name: it.name,
              cost: it.cost as unknown as Prisma.Decimal,
              qty: it.qty,
            })),
          },
        },
      });

      // stock in + last-cost update + movement log for catalog-linked items
      for (const it of items) {
        if (it.productId) {
          await tx.product.updateMany({
            where: { id: it.productId, businessId: ctx.businessId },
            data: { stock: { increment: it.qty }, cost: it.cost as unknown as Prisma.Decimal },
          });
          await tx.stockMovement.create({
            data: {
              businessId: ctx.businessId,
              productId: it.productId,
              delta: it.qty,
              reason: "purchase",
              reference: code,
            },
          });
        }
      }

      // post the buy as an expense so P&L / cash book reflect it
      await tx.transaction.create({
        data: {
          businessId: ctx.businessId,
          type: "expense",
          category: "Purchase / Stock",
          amount: total as unknown as Prisma.Decimal,
          note: `${code} — ${supplierName}`,
          date: when,
        },
      });
    });
  } catch (e) {
    console.error(e);
    return { error: "Could not save the purchase" };
  }

  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/accounts");
  return { ok: true };
}
