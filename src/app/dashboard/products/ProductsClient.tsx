"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  type ProductFormState,
} from "./actions";
import { Icon } from "@/components/icons";

export type ProductDTO = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  cost: number;
  stock: number;
};

const bdt = (n: number) => "৳" + n.toLocaleString("en-US");
const initial: ProductFormState = {};

export function ProductsClient({ products }: { products: ProductDTO[] }) {
  const [editing, setEditing] = useState<ProductDTO | null>(null);
  const [open, setOpen] = useState(false);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(p: ProductDTO) {
    setEditing(p);
    setOpen(true);
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/25 hover:opacity-95"
        >
          <Icon name="plus" width={18} height={18} /> New product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-12 text-center text-black/50 dark:text-white/50">
          No products yet. Click <b>New product</b> to add your first item.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Cost</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-black/50 dark:text-white/50">{p.sku ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{bdt(p.price)}</td>
                  <td className="px-4 py-3 text-right text-black/50 dark:text-white/50">{bdt(p.cost)}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        p.stock <= 0
                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
                          : p.stock < 5
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <a href={`/dashboard/products/${p.id}`} className="text-black/60 dark:text-white/60 hover:underline text-xs">
                        View
                      </a>
                      <button
                        onClick={() => openEdit(p)}
                        className="text-indigo-500 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="text-red-500 hover:underline text-xs">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && <ProductDialog product={editing} onClose={() => setOpen(false)} />}
    </>
  );
}

function ProductDialog({ product, onClose }: { product: ProductDTO | null; onClose: () => void }) {
  const isEdit = !!product;
  const [state, action, pending] = useActionState(
    isEdit ? updateProductAction : createProductAction,
    initial,
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{isEdit ? "Edit product" : "New product"}</h2>
        <form action={action} className="mt-4 space-y-3">
          {isEdit && <input type="hidden" name="id" value={product.id} />}
          <Field name="name" label="Name *" defaultValue={product?.name} required />
          <Field name="sku" label="SKU" defaultValue={product?.sku ?? ""} />
          <div className="grid grid-cols-3 gap-3">
            <Field name="price" label="Price" type="number" defaultValue={product?.price ?? 0} />
            <Field name="cost" label="Cost" type="number" defaultValue={product?.cost ?? 0} />
            <Field name="stock" label="Stock" type="number" defaultValue={product?.stock ?? 0} />
          </div>

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
            <button type="button" onClick={onClose} className="text-sm text-black/60 dark:text-white/60">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        step={type === "number" ? "any" : undefined}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
