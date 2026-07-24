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
        <h1 className="mt-4 text-2xl font-bold text-center">১৪ দিন ফ্রি ট্রায়াল</h1>
        <p className="mt-1 text-sm text-center text-black/60 dark:text-white/60">
          অ্যাকাউন্ট খুলুন — কার্ড লাগবে না।
        </p>

        <form action={action} className="mt-8 space-y-4">
          <Field label="ব্যবসার নাম" name="businessName" placeholder="যেমন: LEEN Lifestyle" />
          <Field label="আপনার নাম" name="name" placeholder="পুরো নাম" />
          <Field label="ইমেইল" name="email" type="email" placeholder="you@example.com" />
          <Field label="পাসওয়ার্ড" name="password" type="password" placeholder="অন্তত ৬ অক্ষর" />

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
            {pending ? "তৈরি হচ্ছে…" : "ট্রায়াল শুরু করুন"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black/60 dark:text-white/60">
          আগে থেকে অ্যাকাউন্ট আছে?{" "}
          <Link href="/login" className="font-medium underline">
            লগইন
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
