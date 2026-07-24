import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "../(auth)/actions";

function daysLeft(date: Date | null | undefined) {
  if (!date) return 0;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

export default async function DashboardPage() {
  const { user, ctx } = await requireTenant();
  const business = user.business!;
  const sub = business.subscription;
  const plan = sub?.plan;
  const period = new Date().toISOString().slice(0, 7);

  const usage = await prisma.usageCounter.findUnique({
    where: { businessId_period: { businessId: ctx.businessId, period } },
  });
  const used = usage?.ordersUsed ?? 0;
  const limit = plan?.orderLimit ?? 0;
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="text-sm text-black/50 dark:text-white/50">{user.name} • {user.email}</p>
        </div>
        <form action={logoutAction}>
          <button className="rounded-lg border border-black/15 dark:border-white/20 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10">
            লগআউট
          </button>
        </form>
      </header>

      {/* Trial / plan banner */}
      <div className="mt-8 rounded-xl border border-black/10 dark:border-white/10 p-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
              বর্তমান প্ল্যান
            </span>
            <p className="mt-1 text-lg font-semibold">
              {plan?.name ?? "—"}{" "}
              <span className="text-sm font-normal text-black/50 dark:text-white/50">
                ({sub?.status})
              </span>
            </p>
          </div>
          {sub?.status === "trialing" && (
            <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-sm font-medium">
              ট্রায়াল — আর {daysLeft(sub.trialEndsAt)} দিন
            </span>
          )}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span>এই মাসের অর্ডার</span>
            <span className="font-medium">
              {used} / {limit}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full ${pct >= 95 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Module grid (placeholders for next phases) */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { t: "Orders", d: "অর্ডার ম্যানেজ", soon: false },
          { t: "Courier", d: "কুরিয়ার ও COD", soon: true },
          { t: "Customers", d: "কাস্টমার লেজার", soon: true },
          { t: "Products", d: "ক্যাটালগ", soon: true },
          { t: "Accounts", d: "আয়/ব্যয়, রিপোর্ট", soon: true },
          { t: "Payroll", d: "স্টাফ বেতন", soon: true },
        ].map((m) => (
          <div key={m.t} className="rounded-xl border border-black/10 dark:border-white/10 p-5">
            <h3 className="font-semibold">{m.t}</h3>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">{m.d}</p>
            {m.soon && (
              <span className="mt-3 inline-block text-xs text-black/40 dark:text-white/40">
                শীঘ্রই
              </span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
