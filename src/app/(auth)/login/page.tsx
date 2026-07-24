"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "../actions";

const initial: AuthState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <div className="min-h-full flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-sm text-black/50 dark:text-white/50">
          ← Ecom-ERP
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-center">লগইন</h1>

        <form action={action} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">ইমেইল</span>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">পাসওয়ার্ড</span>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>

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
            {pending ? "…" : "লগইন"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black/60 dark:text-white/60">
          নতুন?{" "}
          <Link href="/signup" className="font-medium underline">
            ফ্রি ট্রায়াল
          </Link>
        </p>
      </div>
    </div>
  );
}
