"use client";

import { useActionState } from "react";
import { sendToSteadfastAction, refreshStatusAction, type CourierState } from "./actions";

const initial: CourierState = {};

export function SendButton({ orderId, disabled }: { orderId: string; disabled?: boolean }) {
  const [state, action, pending] = useActionState(sendToSteadfastAction, initial);
  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="orderId" value={orderId} />
      <button
        disabled={pending || disabled}
        className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 text-xs font-medium hover:opacity-95 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send to Steadfast"}
      </button>
      {state.error && <span className="text-[11px] text-red-500">{state.error}</span>}
    </form>
  );
}

export function RefreshButton({ orderId }: { orderId: string }) {
  return (
    <form action={refreshStatusAction} className="inline">
      <input type="hidden" name="orderId" value={orderId} />
      <button className="text-indigo-500 hover:underline text-xs">Refresh</button>
    </form>
  );
}
