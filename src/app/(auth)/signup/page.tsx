"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type AuthState } from "../actions";

const initial: AuthState = {};

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, initial);

  return (
    <div className="relative min-h-full flex items-center justify-center px-6 py-16 overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25">
            E
          </div>
          <h1 className="mt-4 text-2xl font-bold">Start your 7-day free trial</h1>
          <p className="text-sm text-[var(--muted)]">No card required · cancel anytime</p>
        </div>

        <div className="mt-8 rounded-2xl border border-black/[0.07] dark:border-white/[0.09] bg-[var(--surface)] p-6 shadow-sm">
          <form action={action} className="space-y-4">
            <Field label="Business name" name="businessName" placeholder="e.g. LEEN Lifestyle" />
            <Field label="Your name" name="name" placeholder="Full name" />
            <Field label="Email" name="email" type="email" placeholder="you@example.com" />
            <Field label="Password" name="password" type="password" placeholder="At least 6 characters" />

            {state.error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-sm font-semibold disabled:opacity-50 transition shadow-sm shadow-indigo-600/20"
            >
              {pending ? "Creating your account…" : "Start free trial"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
      />
    </label>
  );
}
