"use client";

import { updateOrderStatusAction } from "./actions";

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;

export function StatusSelect({
  id,
  status,
  className,
}: {
  id: string;
  status: string;
  className?: string;
}) {
  return (
    <form action={updateOrderStatusAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`rounded-full px-2.5 py-1 text-xs font-medium outline-none cursor-pointer ${className ?? ""}`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
