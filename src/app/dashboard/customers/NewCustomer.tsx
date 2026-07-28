"use client";

import { useActionState, useEffect, useState } from "react";
import { createCustomerAction, type CustomerFormState } from "./actions";
import { Icon } from "@/components/icons";

const initial: CustomerFormState = {};

export function NewCustomer() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createCustomerAction, initial);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/25 hover:opacity-95"
      >
        <Icon name="plus" width={18} height={18} /> New customer
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
            <h2 className="text-lg font-semibold">New customer</h2>
            <form action={action} className="mt-4 space-y-3">
              <Field name="name" label="Name *" required />
              <Field name="phone" label="Phone" placeholder="01XXXXXXXXX" />
              <Field name="address" label="Address" />
              <Field name="note" label="Note" />

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

function Field({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
