"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createOrderAction, type OrderFormState } from "../actions";

type Item = { name: string; price: string; qty: string };
const emptyItem: Item = { name: "", price: "", qty: "1" };
const initial: OrderFormState = {};

export function OrderForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createOrderAction, initial);
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [discount, setDiscount] = useState("0");

  useEffect(() => {
    if (state.ok) router.push("/dashboard/orders");
  }, [state.ok, router]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0),
    [items],
  );
  const total = Math.max(0, subtotal + (Number(deliveryFee) || 0) - (Number(discount) || 0));

  const itemsJson = JSON.stringify(
    items
      .filter((it) => it.name.trim())
      .map((it) => ({ name: it.name.trim(), price: Number(it.price) || 0, qty: Number(it.qty) || 1 })),
  );

  function update(i: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  return (
    <form action={action} className="mt-6 space-y-8">
      {/* Customer */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
          Customer
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input name="customerName" label="Name *" required />
          <Input name="customerPhone" label="Phone" placeholder="01XXXXXXXXX" />
          <div className="sm:col-span-2">
            <Input name="customerAddress" label="Address" />
          </div>
        </div>
      </section>

      {/* Items */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
            Items
          </h2>
          <button
            type="button"
            onClick={() => setItems((p) => [...p, { ...emptyItem }])}
            className="text-sm font-medium underline"
          >
            + Item
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input
                className="col-span-6 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
                placeholder="Product name"
                value={it.name}
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <input
                type="number"
                min="0"
                className="col-span-3 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
                placeholder="Price"
                value={it.price}
                onChange={(e) => update(i, { price: e.target.value })}
              />
              <input
                type="number"
                min="1"
                className="col-span-2 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
                value={it.qty}
                onChange={(e) => update(i, { qty: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setItems((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p))}
                className="col-span-1 text-black/40 hover:text-red-500"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Payment + totals */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Payment</span>
            <select
              name="paymentMethod"
              className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
            >
              <option value="cod">COD (Cash on Delivery)</option>
              <option value="prepaid">Prepaid</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Courier</span>
            <select
              name="courier"
              className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
            >
              <option value="">—</option>
              <option value="steadfast">Steadfast</option>
              <option value="pathao">Pathao</option>
              <option value="redx">RedX</option>
            </select>
          </label>
          <Input name="note" label="Note" />
        </div>

        <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-2 text-sm">
          <Row label="Subtotal" value={`৳${subtotal.toLocaleString("en-US")}`} />
          <label className="flex items-center justify-between">
            <span>Delivery fee</span>
            <input
              name="deliveryFee"
              type="number"
              min="0"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-24 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-right outline-none focus:border-foreground"
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Discount</span>
            <input
              name="discount"
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-24 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-right outline-none focus:border-foreground"
            />
          </label>
          <div className="border-t border-black/10 dark:border-white/10 pt-2">
            <Row label="Total" value={`৳${total.toLocaleString("en-US")}`} bold />
          </div>
        </div>
      </section>

      <input type="hidden" name="items" value={itemsJson} />

      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save order"}
        </button>
        <Link href="/dashboard/orders" className="text-sm text-black/60 dark:text-white/60">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Input({
  name,
  label,
  required,
  placeholder,
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold text-base" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
