"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Choose a category").max(60),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().max(300).optional().or(z.literal("")),
  date: z.string().optional().or(z.literal("")),
});

export type TxnFormState = { error?: string; ok?: boolean };

export async function createTransactionAction(
  _prev: TxnFormState,
  formData: FormData,
): Promise<TxnFormState> {
  const { ctx } = await requireTenant();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const d = parsed.data;
  await prisma.transaction.create({
    data: {
      businessId: ctx.businessId,
      type: d.type,
      category: d.category,
      amount: d.amount as unknown as Prisma.Decimal,
      note: d.note || null,
      date: d.date ? new Date(d.date) : new Date(),
    },
  });

  revalidatePath("/dashboard/accounts");
  return { ok: true };
}

export async function deleteTransactionAction(formData: FormData) {
  const { ctx } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  await prisma.transaction.deleteMany({ where: { id, businessId: ctx.businessId } });
  revalidatePath("/dashboard/accounts");
}
