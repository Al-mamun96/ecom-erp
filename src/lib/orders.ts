import "server-only";
import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/tenant";
import type { Prisma } from "@prisma/client";

export function currentPeriod() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export type UsageInfo = {
  used: number;
  limit: number;
  remaining: number;
  pct: number;
  planName: string | null;
};

/** Read the tenant's current-month order usage against their plan limit. */
export async function getUsage(businessId: string): Promise<UsageInfo> {
  const period = currentPeriod();
  const [counter, sub] = await Promise.all([
    prisma.usageCounter.findUnique({
      where: { businessId_period: { businessId, period } },
    }),
    prisma.subscription.findUnique({
      where: { businessId },
      include: { plan: true },
    }),
  ]);
  const used = counter?.ordersUsed ?? 0;
  const limit = sub?.plan.orderLimit ?? 0;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    pct: limit ? Math.min(100, Math.round((used / limit) * 100)) : 0,
    planName: sub?.plan.name ?? null,
  };
}

export type NewOrderItem = { name: string; price: number; qty: number; productId?: string | null };

export type NewOrderInput = {
  customer: { name: string; phone?: string; address?: string };
  items: NewOrderItem[];
  deliveryFee?: number;
  discount?: number;
  paymentMethod?: "cod" | "prepaid";
  courier?: string | null;
  note?: string | null;
};

export class OrderLimitError extends Error {
  constructor(public limit: number) {
    super(`Monthly order limit (${limit}) reached — please upgrade your plan`);
    this.name = "OrderLimitError";
  }
}

/**
 * Create an order for the tenant, enforcing the monthly order meter.
 * The limit check + counter increment + order insert happen in one transaction
 * so the meter can never be bypassed by concurrent requests.
 */
export async function createOrder(ctx: TenantContext, input: NewOrderInput) {
  const period = currentPeriod();

  return prisma.$transaction(async (tx) => {
    // 1. meter gate
    const sub = await tx.subscription.findUnique({
      where: { businessId: ctx.businessId },
      include: { plan: true },
    });
    const limit = sub?.plan.orderLimit ?? 0;

    const counter = await tx.usageCounter.upsert({
      where: { businessId_period: { businessId: ctx.businessId, period } },
      create: { businessId: ctx.businessId, period, ordersUsed: 0 },
      update: {},
    });
    if (limit > 0 && counter.ordersUsed >= limit) {
      throw new OrderLimitError(limit);
    }

    // 2. customer (reuse by phone if given, else create)
    let customerId: string | null = null;
    const c = input.customer;
    if (c.phone) {
      const existing = await tx.customer.findFirst({
        where: { businessId: ctx.businessId, phone: c.phone },
      });
      customerId =
        existing?.id ??
        (await tx.customer.create({
          data: { businessId: ctx.businessId, name: c.name, phone: c.phone, address: c.address },
        })).id;
    } else if (c.name) {
      customerId = (
        await tx.customer.create({
          data: { businessId: ctx.businessId, name: c.name, address: c.address },
        })
      ).id;
    }

    // 3. totals
    const subtotal = input.items.reduce((s, it) => s + it.price * it.qty, 0);
    const deliveryFee = input.deliveryFee ?? 0;
    const discount = input.discount ?? 0;
    const total = Math.max(0, subtotal + deliveryFee - discount);

    // 4. per-business sequential code
    const count = await tx.order.count({ where: { businessId: ctx.businessId } });
    const code = `ORD-${String(count + 1).padStart(4, "0")}`;

    // 5. create order
    const order = await tx.order.create({
      data: {
        businessId: ctx.businessId,
        code,
        customerId,
        status: "pending",
        subtotal: subtotal as unknown as Prisma.Decimal,
        deliveryFee: deliveryFee as unknown as Prisma.Decimal,
        discount: discount as unknown as Prisma.Decimal,
        total: total as unknown as Prisma.Decimal,
        paymentMethod: input.paymentMethod ?? "cod",
        courier: input.courier ?? null,
        note: input.note ?? null,
        items: {
          create: input.items.map((it) => ({
            productId: it.productId ?? null,
            name: it.name,
            price: it.price as unknown as Prisma.Decimal,
            qty: it.qty,
          })),
        },
      },
    });

    // 6. increment meter
    await tx.usageCounter.update({
      where: { businessId_period: { businessId: ctx.businessId, period } },
      data: { ordersUsed: { increment: 1 } },
    });

    return order;
  });
}
