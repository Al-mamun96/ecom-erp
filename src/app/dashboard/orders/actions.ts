"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { createOrder, OrderLimitError } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  qty: z.coerce.number().int().min(1),
});

const schema = z.object({
  customerName: z.string().min(2, "কাস্টমারের নাম দিন").max(80),
  customerPhone: z.string().max(20).optional().or(z.literal("")),
  customerAddress: z.string().max(300).optional().or(z.literal("")),
  paymentMethod: z.enum(["cod", "prepaid"]).default("cod"),
  courier: z.string().max(20).optional().or(z.literal("")),
  deliveryFee: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  note: z.string().max(500).optional().or(z.literal("")),
  items: z.string(), // JSON array
});

export type OrderFormState = { error?: string; ok?: boolean };

export async function createOrderAction(
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const { ctx } = await requireTenant();

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "তথ্য ঠিক নেই" };

  let items;
  try {
    items = z.array(itemSchema).min(1, "অন্তত একটি আইটেম দিন").parse(JSON.parse(parsed.data.items));
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "আইটেম তালিকা ঠিক নেই" };
  }

  try {
    await createOrder(ctx, {
      customer: {
        name: parsed.data.customerName,
        phone: parsed.data.customerPhone || undefined,
        address: parsed.data.customerAddress || undefined,
      },
      items,
      deliveryFee: parsed.data.deliveryFee,
      discount: parsed.data.discount,
      paymentMethod: parsed.data.paymentMethod,
      courier: parsed.data.courier || null,
      note: parsed.data.note || null,
    });
  } catch (e) {
    if (e instanceof OrderLimitError) return { error: e.message };
    console.error(e);
    return { error: "অর্ডার তৈরি করা যায়নি" };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  return { ok: true };
}

const statusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
]);

export async function updateOrderStatusAction(formData: FormData) {
  const { ctx } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  const status = statusSchema.parse(formData.get("status"));

  // scoped update — never touch another tenant's row
  await prisma.order.updateMany({
    where: { id, businessId: ctx.businessId },
    data: { status },
  });
  revalidatePath("/dashboard/orders");
}
