"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createEmployeeAction,
  updateEmployeeAction,
  deleteEmployeeAction,
  paySalaryAction,
  type EmployeeFormState,
  type PayState,
} from "./actions";
import { Icon } from "@/components/icons";

export type EmployeeDTO = {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
  salary: number;
  paidThisMonth: number;
};

const bdt = (n: number) => "৳" + n.toLocaleString("en-US");
const emptyForm: EmployeeFormState = {};
const emptyPay: PayState = {};
const thisMonth = new Date().toISOString().slice(0, 7);

export function PayrollClient({ employees, month }: { employees: EmployeeDTO[]; month: string }) {
  const [editing, setEditing] = useState<EmployeeDTO | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [paying, setPaying] = useState<EmployeeDTO | null>(null);

  return (
    <>
      <div className="flex items-center justify-end">
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/25 hover:opacity-95"
        >
          <Icon name="plus" width={18} height={18} /> New employee
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-12 text-center text-black/50 dark:text-white/50">
          No staff yet. Click <b>New employee</b> to add your team.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium text-right">Monthly salary</th>
                <th className="px-4 py-3 font-medium text-right">Paid ({month})</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const fullyPaid = e.paidThisMonth >= e.salary && e.salary > 0;
                return (
                  <tr key={e.id} className="border-t border-black/5 dark:border-white/5">
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3 text-black/60 dark:text-white/60">{e.role ?? "—"}</td>
                    <td className="px-4 py-3 text-black/60 dark:text-white/60">{e.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{bdt(e.salary)}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          fullyPaid
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : e.paidThisMonth > 0
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/50"
                        }`}
                      >
                        {bdt(e.paidThisMonth)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setPaying(e)}
                          className="rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-medium hover:bg-emerald-500/25"
                        >
                          Pay
                        </button>
                        <a href={`/dashboard/payroll/${e.id}`} className="text-black/60 dark:text-white/60 hover:underline text-xs">
                          View
                        </a>
                        <button
                          onClick={() => {
                            setEditing(e);
                            setFormOpen(true);
                          }}
                          className="text-indigo-500 hover:underline text-xs"
                        >
                          Edit
                        </button>
                        <form action={deleteEmployeeAction}>
                          <input type="hidden" name="id" value={e.id} />
                          <button className="text-red-500 hover:underline text-xs">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && <EmployeeDialog employee={editing} onClose={() => setFormOpen(false)} />}
      {paying && <PayDialog employee={paying} onClose={() => setPaying(null)} />}
    </>
  );
}

function EmployeeDialog({ employee, onClose }: { employee: EmployeeDTO | null; onClose: () => void }) {
  const isEdit = !!employee;
  const [state, action, pending] = useActionState(
    isEdit ? updateEmployeeAction : createEmployeeAction,
    emptyForm,
  );
  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal onClose={onClose} title={isEdit ? "Edit employee" : "New employee"}>
      <form action={action} className="mt-4 space-y-3">
        {isEdit && <input type="hidden" name="id" value={employee.id} />}
        <Field name="name" label="Name *" defaultValue={employee?.name} required />
        <div className="grid grid-cols-2 gap-3">
          <Field name="role" label="Role" defaultValue={employee?.role ?? ""} />
          <Field name="phone" label="Phone" defaultValue={employee?.phone ?? ""} />
        </div>
        <Field name="salary" label="Monthly salary (৳)" type="number" defaultValue={employee?.salary ?? 0} />
        {state.error && <Err msg={state.error} />}
        <Actions pending={pending} onClose={onClose} />
      </form>
    </Modal>
  );
}

function PayDialog({ employee, onClose }: { employee: EmployeeDTO; onClose: () => void }) {
  const [state, action, pending] = useActionState(paySalaryAction, emptyPay);
  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal onClose={onClose} title={`Pay salary — ${employee.name}`}>
      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="employeeId" value={employee.id} />
        <div className="grid grid-cols-2 gap-3">
          <Field name="amount" label="Amount (৳)" type="number" defaultValue={employee.salary} required />
          <label className="block">
            <span className="text-sm font-medium">For month</span>
            <input
              name="forMonth"
              type="month"
              defaultValue={thisMonth}
              className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        </div>
        <Field name="note" label="Note" />
        <p className="text-xs text-black/40 dark:text-white/40">
          This also posts a Salary expense to Accounts.
        </p>
        {state.error && <Err msg={state.error} />}
        <Actions pending={pending} onClose={onClose} label="Pay" />
      </form>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
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

function Err({ msg }: { msg: string }) {
  return (
    <p className="text-sm text-red-600 dark:text-red-400" role="alert">
      {msg}
    </p>
  );
}

function Actions({
  pending,
  onClose,
  label = "Save",
}: {
  pending: boolean;
  onClose: () => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : label}
      </button>
      <button type="button" onClick={onClose} className="text-sm text-black/60 dark:text-white/60">
        Cancel
      </button>
    </div>
  );
}
