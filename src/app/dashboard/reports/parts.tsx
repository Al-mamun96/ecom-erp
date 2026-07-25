import type { ReactNode } from "react";

export function StatGrid({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-4">
          <div className="text-xl font-bold tracking-tight">{s.value}</div>
          <div className="text-xs text-black/50 dark:text-white/50">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function ReportTable({
  head,
  align = [],
  rows,
  empty = "No data in this range.",
}: {
  head: string[];
  align?: ("l" | "r")[];
  rows: ReactNode[][];
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-10 text-center text-sm text-black/50 dark:text-white/50">
        {empty}
      </div>
    );
  }
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950">
      <table className="w-full text-sm">
        <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-3 font-medium ${align[i] === "r" ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-black/5 dark:border-white/5">
              {r.map((c, ci) => (
                <td key={ci} className={`px-4 py-3 ${align[ci] === "r" ? "text-right" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 font-semibold">{children}</h2>;
}
