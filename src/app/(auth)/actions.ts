"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "shop"
  );
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export type AuthState = { error?: string };

const signupSchema = z.object({
  businessName: z.string().min(2, "ব্যবসার নাম দিন").max(80),
  name: z.string().min(2, "আপনার নাম দিন").max(80),
  email: z.string().email("সঠিক ইমেইল দিন").max(120),
  password: z.string().min(6, "পাসওয়ার্ড অন্তত ৬ অক্ষর"),
});

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    businessName: formData.get("businessName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "তথ্য ঠিক নেই" };
  }
  const { businessName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return { error: "এই ইমেইলে অ্যাকাউন্ট আছে — লগইন করুন" };

  const trialPlan = await prisma.plan.findUnique({ where: { slug: "trial" } });
  if (!trialPlan) return { error: "Trial প্ল্যান পাওয়া যায়নি (seed চালান)" };

  // unique slug
  let slug = slugify(businessName);
  if (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const user = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({ data: { name: businessName, slug } });
    const owner = await tx.user.create({
      data: {
        businessId: business.id,
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "OWNER",
      },
    });
    await tx.subscription.create({
      data: {
        businessId: business.id,
        planId: trialPlan.id,
        status: "trialing",
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
        gateway: "manual",
      },
    });
    await tx.usageCounter.create({
      data: { businessId: business.id, period: currentPeriod(), ordersUsed: 0 },
    });
    return owner;
  });

  await createSession(user.id);
  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().email("সঠিক ইমেইল দিন"),
  password: z.string().min(1, "পাসওয়ার্ড দিন"),
});

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "তথ্য ঠিক নেই" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { error: "ইমেইল বা পাসওয়ার্ড ভুল" };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
