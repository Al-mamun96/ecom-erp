"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const employeeSchema = z.object({
  name: z.string().min(2, "Enter the employee's name").max(80),
  phone: z.string().max(20).optional().or(z.literal("")),
  role: z.string().max(60).optional().or(z.literal("")),
  salary: z.coerce.number().min(0).default(0),
});

export type EmployeeFormState = { error?: string; ok?: boolean };

export async function createEmployeeAction(
  _prev: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const { ctx } = await requireTenant();
  const parsed = employeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const d = parsed.data;
  await prisma.employee.create({
    data: {
      businessId: ctx.businessId,
      name: d.name,
      phone: d.phone || null,
      role: d.role || null,
      salary: d.salary as unknown as Prisma.Decimal,
    },
  });

  revalidatePath("/dashboard/payroll");
  return { ok: true };
}

export async function updateEmployeeAction(
  _prev: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const { ctx } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  const parsed = employeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const d = parsed.data;
  await prisma.employee.updateMany({
    where: { id, businessId: ctx.businessId },
    data: {
      name: d.name,
      phone: d.phone || null,
      role: d.role || null,
      salary: d.salary as unknown as Prisma.Decimal,
    },
  });

  revalidatePath("/dashboard/payroll");
  return { ok: true };
}

export async function deleteEmployeeAction(formData: FormData) {
  const { ctx } = await requireTenant();
  const id = String(formData.get("id") ?? "");
  await prisma.employee.deleteMany({ where: { id, businessId: ctx.businessId } });
  revalidatePath("/dashboard/payroll");
}

const paySchema = z.object({
  employeeId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  forMonth: z.string().regex(/^\d{4}-\d{2}$/, "Choose a month"),
  note: z.string().max(300).optional().or(z.literal("")),
});

export type PayState = { error?: string; ok?: boolean };

export async function paySalaryAction(_prev: PayState, formData: FormData): Promise<PayState> {
  const { ctx } = await requireTenant();
  const parsed = paySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  const d = parsed.data;

  // employee must belong to this tenant
  const employee = await prisma.employee.findFirst({
    where: { id: d.employeeId, businessId: ctx.businessId },
  });
  if (!employee) return { error: "Employee not found" };

  // Record the payment AND post a matching Salary expense so P&L stays correct.
  await prisma.$transaction(async (tx) => {
    await tx.salaryPayment.create({
      data: {
        businessId: ctx.businessId,
        employeeId: employee.id,
        amount: d.amount as unknown as Prisma.Decimal,
        forMonth: d.forMonth,
        note: d.note || null,
      },
    });
    await tx.transaction.create({
      data: {
        businessId: ctx.businessId,
        type: "expense",
        category: "Salary",
        amount: d.amount as unknown as Prisma.Decimal,
        note: `Salary: ${employee.name} (${d.forMonth})`,
      },
    });
  });

  revalidatePath("/dashboard/payroll");
  revalidatePath("/dashboard/accounts");
  return { ok: true };
}
