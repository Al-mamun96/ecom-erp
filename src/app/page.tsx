import Link from "next/link";

const modules = [
  { icon: "📦", title: "Orders", desc: "Create orders, statuses, COD, customer info." },
  { icon: "🚚", title: "Courier", desc: "Steadfast / Pathao / RedX — send, webhooks, COD reconcile." },
  { icon: "💰", title: "Income / Expense", desc: "Cash book, categories, transactions." },
  { icon: "👥", title: "Payroll", desc: "Staff salary & payments." },
  { icon: "📊", title: "Accounts & Reports", desc: "P&L, balances, sales reports, exports." },
  { icon: "🏷️", title: "Products & Customers", desc: "Light catalog & customer ledger." },
];

const plans = [
  { name: "Trial", orders: "50 orders", price: "Free", note: "14 days", highlight: false },
  { name: "Starter", orders: "500 orders/mo", price: "৳800", note: "monthly", highlight: false },
  { name: "Growth", orders: "1,500 orders/mo", price: "৳1,500", note: "monthly", highlight: true },
  { name: "Business", orders: "2,000 orders/mo", price: "৳2,500", note: "monthly", highlight: false },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <span className="inline-block rounded-full border border-black/10 dark:border-white/15 px-3 py-1 text-xs font-medium text-black/60 dark:text-white/60">
          Multi-tenant SaaS • Next.js
        </span>
        <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight">Ecom-ERP</h1>
        <p className="mt-4 text-lg text-black/70 dark:text-white/70 max-w-2xl mx-auto">
          A lightweight order & business manager for small e-commerce shops. Just the
          essentials — orders, courier, accounts, reports. Subscription priced by monthly orders.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
          >
            Start 14-day free trial
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-black/15 dark:border-white/20 px-5 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
          Core modules
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <div key={m.title} className="rounded-xl border border-black/10 dark:border-white/10 p-5">
              <div className="text-2xl">{m.icon}</div>
              <h3 className="mt-3 font-semibold">{m.title}</h3>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
          Plans (by orders)
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl border p-5 text-center ${
                p.highlight ? "border-foreground shadow-lg" : "border-black/10 dark:border-white/10"
              }`}
            >
              {p.highlight && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Popular
                </span>
              )}
              <h3 className="mt-1 font-semibold">{p.name}</h3>
              <p className="mt-3 text-2xl font-bold">{p.price}</p>
              <p className="text-xs text-black/50 dark:text-white/50">{p.note}</p>
              <p className="mt-3 text-sm text-black/60 dark:text-white/60">{p.orders}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-center text-sm text-black/40 dark:text-white/40">
        © {new Date().getFullYear()} Ecom-ERP — a lite product, separate from Eltiz.
      </footer>
    </main>
  );
}
