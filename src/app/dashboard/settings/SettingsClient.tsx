"use client";

import { useActionState } from "react";
import {
  updateBusinessAction,
  changePasswordAction,
  addStaffAction,
  removeStaffAction,
  saveCourierAction,
  type SettingsState,
} from "./actions";

const initial: SettingsState = {};

export type StaffDTO = { id: string; name: string; email: string; role: string };

export function SettingsClient({
  business,
  staff,
  isOwner,
  courierConfigured,
}: {
  business: { name: string; phone: string | null; address: string | null };
  staff: StaffDTO[];
  isOwner: boolean;
  courierConfigured: boolean;
}) {
  return (
    <div className="mt-6 space-y-6">
      {isOwner && <BusinessCard business={business} />}
      <PasswordCard />
      {isOwner && <CourierCard configured={courierConfigured} />}
      {isOwner && <StaffCard staff={staff} />}
    </div>
  );
}

function CourierCard({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(saveCourierAction, initial);
  return (
    <Card
      title="Courier — Steadfast"
      desc="Paste your Steadfast API credentials to enable sending parcels. Stored encrypted."
    >
      {configured && (
        <p className="mb-3 text-sm text-emerald-600 dark:text-emerald-400">
          ✓ Connected. Re-enter keys below to update.
        </p>
      )}
      <form action={action} className="space-y-3 max-w-lg">
        <Field name="apiKey" label="API Key" required />
        <Field name="secretKey" label="Secret Key" type="password" required />
        <Msg state={state} />
        <SaveBtn pending={pending} label="Save keys" />
      </form>
    </Card>
  );
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 p-6">
      <h2 className="font-semibold">{title}</h2>
      {desc && <p className="text-sm text-black/50 dark:text-white/50">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Msg({ state }: { state: SettingsState }) {
  if (state.error) return <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>;
  if (state.message) return <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.message}</p>;
  return null;
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}

function SaveBtn({ pending, label = "Save" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function BusinessCard({ business }: { business: { name: string; phone: string | null; address: string | null } }) {
  const [state, action, pending] = useActionState(updateBusinessAction, initial);
  return (
    <Card title="Business profile" desc="Shown on the dashboard and documents.">
      <form action={action} className="space-y-3 max-w-lg">
        <Field name="name" label="Business name" defaultValue={business.name} required />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field name="phone" label="Phone" defaultValue={business.phone ?? ""} placeholder="01XXXXXXXXX" />
          <Field name="address" label="Address" defaultValue={business.address ?? ""} />
        </div>
        <Msg state={state} />
        <SaveBtn pending={pending} />
      </form>
    </Card>
  );
}

function PasswordCard() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  return (
    <Card title="Change password">
      <form action={action} className="space-y-3 max-w-lg">
        <Field name="currentPassword" label="Current password" type="password" required />
        <Field name="newPassword" label="New password" type="password" required />
        <Msg state={state} />
        <SaveBtn pending={pending} label="Update password" />
      </form>
    </Card>
  );
}

function StaffCard({ staff }: { staff: StaffDTO[] }) {
  const [state, action, pending] = useActionState(addStaffAction, initial);
  return (
    <Card title="Staff seats" desc="Add team members who can log in to this business.">
      {staff.length > 0 && (
        <ul className="mb-4 divide-y divide-black/5 dark:divide-white/5">
          {staff.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-black/50 dark:text-white/50">{s.email}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60">
                  {s.role.toLowerCase()}
                </span>
                {s.role === "STAFF" && (
                  <form action={removeStaffAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-red-500 hover:underline text-xs">Remove</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="grid sm:grid-cols-3 gap-3 items-end">
        <Field name="name" label="Name" required />
        <Field name="email" label="Email" type="email" required />
        <Field name="password" label="Temp password" type="password" required />
        <div className="sm:col-span-3 flex items-center gap-3">
          <SaveBtn pending={pending} label="Add staff" />
          <Msg state={state} />
        </div>
      </form>
    </Card>
  );
}
