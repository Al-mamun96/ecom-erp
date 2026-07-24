"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type AuthState } from "../actions";

const initial: AuthState = {};

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, initial);

  return (
    <div className="min-h-full flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-sm text-black/50 dark:text-white/50">
          ← Ecom-ERP
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-center">Start your 14-day free trial</h1>
        <p className="mt-1 text-sm text-center text-black/60 dark:text-white/60">
          Create an account — no card required.
        </p>

        <form action={action} className="mt-8 space-y-4">
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
            className="w-full rounded-lg bg-foreground text-background py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {pending ? "Creating…" : "Start trial"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black/60 dark:text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium underline">
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
        className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
