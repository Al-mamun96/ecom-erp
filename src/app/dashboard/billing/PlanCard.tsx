"use client";

import { useActionState } from "react";
import { requestPlanAction, type BillingState } from "./actions";

const initial: BillingState = {};

export function PlanCard({
  plan,
  current,
  highlight,
}: {
  plan: { id: string; name: string; price: number; orderLimit: number };
  current: boolean;
  highlight: boolean;
}) {
  const [state, action, pending] = useActionState(requestPlanAction, initial);

  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col ${
        highlight
          ? "border-indigo-500 shadow-xl shadow-indigo-500/10"
          : "border-black/10 dark:border-white/10"
      }`}
    >
      {highlight && (
        <span className="text-xs font-semibold text-indigo-500 mb-1">Popular</span>
      )}
      <h3 className="font-semibold text-lg">{plan.name}</h3>
      <div className="mt-2 text-3xl font-bold">
        ৳{plan.price.toLocaleString("en-US")}
        <span className="text-sm font-normal text-black/40 dark:text-white/40">/mo</span>
      </div>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        {plan.orderLimit.toLocaleString("en-US")} orders / month
      </p>

      <div className="mt-5 flex-1 flex flex-col justify-end">
        {current ? (
          <div className="rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 text-sm font-medium text-center">
            Current plan
          </div>
        ) : (
          <form action={action}>
            <input type="hidden" name="planId" value={plan.id} />
            <button
              disabled={pending}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 text-sm font-medium hover:opacity-95 disabled:opacity-50"
            >
              {pending ? "…" : "Request upgrade"}
            </button>
          </form>
        )}
        {state.message && (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{state.message}</p>
        )}
        {state.error && <p className="mt-2 text-xs text-red-500">{state.error}</p>}
      </div>
    </div>
  );
}
