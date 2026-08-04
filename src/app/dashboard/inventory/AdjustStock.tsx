"use client";

import { useActionState, useEffect, useState } from "react";
import { adjustStockAction, type AdjustState } from "./actions";

const initial: AdjustState = {};

export function AdjustStock({ productId, name, stock }: { productId: string; name: string; stock: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(adjustStockAction, initial);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-indigo-500 hover:underline text-xs">
        Adjust
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-black/10 dark:border-white/10 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Adjust stock</h2>
            <p className="text-sm text-[var(--muted)]">
              {name} · current {stock}
            </p>
            <form action={action} className="mt-4 space-y-3">
              <input type="hidden" name="productId" value={productId} />
              <label className="block">
                <span className="text-sm font-medium">Change (+ add / − remove)</span>
                <input
                  name="delta"
                  type="number"
                  placeholder="e.g. 10 or -3"
                  required
                  className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Reason / note</span>
                <input
                  name="note"
                  placeholder="damaged, recount, etc."
                  className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </label>

              {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {pending ? "Saving…" : "Apply"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-sm text-[var(--muted)]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
