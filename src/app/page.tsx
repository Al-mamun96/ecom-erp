import Link from "next/link";

const modules = [
  { icon: "📦", title: "Orders", desc: "অর্ডার তৈরি, স্ট্যাটাস, COD, কাস্টমার তথ্য।" },
  { icon: "🚚", title: "Courier", desc: "Steadfast / Pathao / RedX — পাঠানো, ওয়েবহুক, COD মিলানো।" },
  { icon: "💰", title: "Income / Expense", desc: "ক্যাশ বুক, ক্যাটাগরি, লেনদেন।" },
  { icon: "👥", title: "Payroll", desc: "স্টাফ বেতন ও পেমেন্ট।" },
  { icon: "📊", title: "Accounts & Reports", desc: "P&L, ব্যালেন্স, সেলস রিপোর্ট, এক্সপোর্ট।" },
  { icon: "🏷️", title: "Products & Customers", desc: "হালকা ক্যাটালগ ও কাস্টমার লেজার।" },
];

const plans = [
  { name: "Trial", orders: "৫০ অর্ডার", price: "ফ্রি", note: "১৪ দিন", highlight: false },
  { name: "Starter", orders: "৫০০ অর্ডার/মাস", price: "৳৮০০", note: "মাসিক", highlight: false },
  { name: "Growth", orders: "১,৫০০ অর্ডার/মাস", price: "৳১,৫০০", note: "মাসিক", highlight: true },
  { name: "Business", orders: "২,০০০ অর্ডার/মাস", price: "৳২,৫০০", note: "মাসিক", highlight: false },
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
          ছোট ই-কমার্স ব্যবসার জন্য হালকা অর্ডার ও ব্যবসা ম্যানেজার। শুধু দরকারি
          ফিচার — অর্ডার, কুরিয়ার, হিসাব, রিপোর্ট। মাসিক অর্ডার অনুযায়ী সাবস্ক্রিপশন।
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
          >
            ১৪ দিন ফ্রি ট্রায়াল
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-black/15 dark:border-white/20 px-5 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            লগইন
          </Link>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
          কোর মডিউল
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
          প্ল্যান (অর্ডার অনুযায়ী)
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
                  জনপ্রিয়
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
        © {new Date().getFullYear()} Ecom-ERP — Eltiz থেকে আলাদা lite প্রোডাক্ট।
      </footer>
    </main>
  );
}
