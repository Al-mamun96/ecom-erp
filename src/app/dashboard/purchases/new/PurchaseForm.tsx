"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPurchaseAction, type PurchaseFormState } from "../actions";

export type ProductOption = { id: string; name: string; cost: number; stock: number };
export type SupplierOption = { id: string; name: string };

type Item = { name: string; cost: string; qty: string; productId: string | null };
const emptyItem: Item = { name: "", cost: "", qty: "1", productId: null };
const initial: PurchaseFormState = {};

export function PurchaseForm({
  products,
  suppliers,
}: {
  products: ProductOption[];
  suppliers: SupplierOption[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createPurchaseAction, initial);
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);
  const [discount, setDiscount] = useState("0");
  const [amountPaid, setAmountPaid] = useState("0");

  useEffect(() => {
    if (state.ok) router.push("/dashboard/purchases");
  }, [state.ok, router]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.cost) || 0) * (Number(it.qty) || 0), 0),
    [items],
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const itemsJson = JSON.stringify(
    items
      .filter((it) => it.name.trim())
      .map((it) => ({ name: it.name.trim(), cost: Number(it.cost) || 0, qty: Number(it.qty) || 1, productId: it.productId })),
  );

  function update(i: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function onNameChange(i: number, name: string) {
    const match = products.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    if (match) update(i, { name, productId: match.id, cost: String(match.cost) });
    else update(i, { name, productId: null });
  }

  return (
    <form action={action} className="mt-6 space-y-8">
      <section className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Supplier</span>
          <select
            name="supplierId"
            className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
          >
            <option value="">— No supplier —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Date</span>
          <input
            name="date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </label>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Items</h2>
          <button type="button" onClick={() => setItems((p) => [...p, { ...emptyItem }])} className="text-sm font-medium underline">
            + Item
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input
                list="purchase-products"
                className="col-span-6 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder="Pick a product or type…"
                value={it.name}
                onChange={(e) => onNameChange(i, e.target.value)}
              />
              <input
                type="number"
                min="0"
                className="col-span-3 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder="Unit cost"
                value={it.cost}
                onChange={(e) => update(i, { cost: e.target.value })}
              />
              <input
                type="number"
                min="1"
                className="col-span-2 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500"
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
        <p className="mt-2 text-xs text-[var(--muted)]">
          Linked products get stock added and their cost updated automatically.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Note</span>
          <input
            name="note"
            className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </label>

        <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-4 space-y-2 text-sm">
          <Row label="Subtotal" value={`৳${subtotal.toLocaleString("en-US")}`} />
          <label className="flex items-center justify-between">
            <span>Discount</span>
            <input
              name="discount"
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-24 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-right outline-none focus:border-indigo-500"
            />
          </label>
          <div className="border-t border-black/10 dark:border-white/10 pt-2">
            <Row label="Total" value={`৳${total.toLocaleString("en-US")}`} bold />
          </div>
          <label className="flex items-center justify-between">
            <span>Amount paid</span>
            <input
              name="amountPaid"
              type="number"
              min="0"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-24 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-right outline-none focus:border-indigo-500"
            />
          </label>
          <p className="text-xs text-[var(--muted)] text-right">
            Due: ৳{Math.max(0, total - (Number(amountPaid) || 0)).toLocaleString("en-US")}
          </p>
        </div>
      </section>

      <datalist id="purchase-products">
        {products.map((p) => (
          <option key={p.id} value={p.name}>
            {`cost ৳${p.cost} · stock ${p.stock}`}
          </option>
        ))}
      </datalist>

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
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save purchase"}
        </button>
        <Link href="/dashboard/purchases" className="text-sm text-[var(--muted)]">
          Cancel
        </Link>
      </div>
    </form>
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
