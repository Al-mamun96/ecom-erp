"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DateFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  function apply(nf: string, nt: string) {
    router.push(`${pathname}?from=${nf}&to=${nt}`);
  }

  function preset(days: number) {
    const now = new Date();
    const start = new Date(now.getTime() - (days - 1) * 86400000);
    setF(iso(start));
    setT(iso(now));
    apply(iso(start), iso(now));
  }

  function thisMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setF(iso(start));
    setT(iso(now));
    apply(iso(start), iso(now));
  }

  return (
    <div className="no-print flex flex-wrap items-end gap-2">
      <label className="text-sm">
        <span className="block text-xs text-black/50 dark:text-white/50">From</span>
        <input
          type="date"
          value={f}
          onChange={(e) => setF(e.target.value)}
          className="mt-0.5 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-foreground"
        />
      </label>
      <label className="text-sm">
        <span className="block text-xs text-black/50 dark:text-white/50">To</span>
        <input
          type="date"
          value={t}
          onChange={(e) => setT(e.target.value)}
          className="mt-0.5 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-foreground"
        />
      </label>
      <button
        onClick={() => apply(f, t)}
        className="rounded-lg bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:opacity-90"
      >
        Apply
      </button>
      <div className="flex items-center gap-1 ml-1">
        {[
          { label: "7d", fn: () => preset(7) },
          { label: "30d", fn: () => preset(30) },
          { label: "This month", fn: thisMonth },
        ].map((p) => (
          <button
            key={p.label}
            onClick={p.fn}
            className="rounded-lg border border-black/15 dark:border-white/20 px-2.5 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/10"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
