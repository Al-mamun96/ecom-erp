import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { getUsage } from "@/lib/orders";
import { OrderForm } from "./OrderForm";

export default async function NewOrderPage() {
  const { ctx } = await requireTenant();
  const usage = await getUsage(ctx.businessId);

  // Meter gate at the page level too — block reaching the form when limit is hit.
  if (usage.limit > 0 && usage.remaining === 0) {
    redirect("/dashboard/orders");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard/orders" className="text-sm text-black/50 dark:text-white/50">
        ← অর্ডার
      </Link>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold">নতুন অর্ডার</h1>
        <span className="text-sm text-black/50 dark:text-white/50">
          বাকি: {usage.remaining} / {usage.limit}
        </span>
      </div>
      <OrderForm />
    </main>
  );
}
