"use client";

export function PrintTrigger() {
  return (
    <div className="no-print flex items-center gap-3 mb-6">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-90"
      >
        Print / Save PDF
      </button>
      <button
        onClick={() => window.close()}
        className="rounded-lg border border-black/20 px-4 py-2 text-sm"
      >
        Close
      </button>
    </div>
  );
}
