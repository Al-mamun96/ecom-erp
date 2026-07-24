"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";

export type SettingsState = { error?: string; ok?: boolean; message?: string };

// --- Business profile ---
const businessSchema = z.object({
  name: z.string().min(2, "Enter a business name").max(80),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
});

export async function updateBusinessAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { ctx } = await requireTenant();
  if (ctx.role !== "OWNER") return { error: "Only the owner can edit business details" };

  const parsed = businessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  await prisma.business.update({
    where: { id: ctx.businessId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true, message: "Business details saved" };
}

// --- Change password (self) ---
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function changePasswordAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { user } = await requireTenant();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { error: "Current password is wrong" };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });

  return { ok: true, message: "Password updated" };
}

// --- Staff seats ---
const staffSchema = z.object({
  name: z.string().min(2, "Enter the staff member's name").max(80),
  email: z.string().email("Enter a valid email").max(120),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function addStaffAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { ctx } = await requireTenant();
  if (ctx.role !== "OWNER") return { error: "Only the owner can add staff" };

  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "A user with this email already exists" };
  }

  await prisma.user.create({
    data: {
      businessId: ctx.businessId,
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: "STAFF",
    },
  });

  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Staff member added" };
}

// --- Courier (Steadfast) credentials ---
const courierSchema = z.object({
  apiKey: z.string().min(4, "Enter the API key").max(200),
  secretKey: z.string().min(4, "Enter the secret key").max(200),
});

export async function saveCourierAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { ctx } = await requireTenant();
  if (ctx.role !== "OWNER") return { error: "Only the owner can set courier keys" };

  const parsed = courierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  await prisma.business.update({
    where: { id: ctx.businessId },
    data: {
      steadfastApiKey: encryptSecret(parsed.data.apiKey),
      steadfastSecretKey: encryptSecret(parsed.data.secretKey),
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/courier");
  return { ok: true, message: "Steadfast keys saved" };
}

export async function removeStaffAction(formData: FormData) {
  const { ctx } = await requireTenant();
  if (ctx.role !== "OWNER") return;
  const id = String(formData.get("id") ?? "");
  // Never remove yourself or a non-STAFF user; keep it tenant-scoped.
  await prisma.user.deleteMany({
    where: { id, businessId: ctx.businessId, role: "STAFF" },
  });
  revalidatePath("/dashboard/settings");
}
