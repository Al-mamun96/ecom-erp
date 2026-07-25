"use client";

export function ReportActions({
  type,
  from,
  to,
}: {
  type: string;
  from: string;
  to: string;
}) {
  const csvHref = `/dashboard/reports/export?type=${type}&from=${from}&to=${to}`;
  return (
    <div className="no-print flex items-center gap-2">
      <a
        href={csvHref}
        className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 dark:border-white/20 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
      >
        ⬇ CSV
      </a>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-3 py-1.5 text-sm font-medium hover:opacity-95"
      >
        🖨 PDF
      </button>
    </div>
  );
}
