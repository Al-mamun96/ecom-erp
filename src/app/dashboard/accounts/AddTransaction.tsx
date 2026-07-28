"use client";

import { useActionState, useEffect, useState } from "react";
import { createTransactionAction, type TxnFormState } from "./actions";
import { Icon } from "@/components/icons";

const initial: TxnFormState = {};

const CATEGORIES: Record<"income" | "expense", string[]> = {
  income: ["Sale", "Investment", "Refund received", "Other"],
  expense: ["Purchase / Stock", "Salary", "Rent", "Marketing", "Delivery", "Utilities", "Other"],
};

export function AddTransaction() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("income");
  const [state, action, pending] = useActionState(createTransactionAction, initial);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/25 hover:opacity-95"
      >
        <Icon name="plus" width={18} height={18} /> Add transaction
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Add transaction</h2>
            <form action={action} className="mt-4 space-y-3">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2">
                {(["income", "expense"] as const).map((t) => (
                  <label
                    key={t}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium capitalize transition ${
                      type === t
                        ? t === "income"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "border-black/15 dark:border-white/20 text-black/60 dark:text-white/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      checked={type === t}
                      onChange={() => setType(t)}
                      className="sr-only"
                    />
                    {t}
                  </label>
                ))}
              </div>

              <label className="block">
                <span className="text-sm font-medium">Category</span>
                <select
                  name="category"
                  className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
                >
                  {CATEGORIES[type].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium">Amount (৳)</span>
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="any"
                    required
                    className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Date</span>
                  <input
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium">Note</span>
                <input
                  name="note"
                  className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </label>

              {state.error && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {state.error}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm text-black/60 dark:text-white/60"
                >
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
