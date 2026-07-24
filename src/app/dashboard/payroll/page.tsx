import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PayrollClient, type EmployeeDTO } from "./PayrollClient";

const bdt = (n: number) => "৳" + n.toLocaleString("en-US");

export default async function PayrollPage() {
  const { ctx } = await requireTenant();
  const month = new Date().toISOString().slice(0, 7);

  const [employees, paidGroups] = await Promise.all([
    prisma.employee.findMany({
      where: { businessId: ctx.businessId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.salaryPayment.groupBy({
      by: ["employeeId"],
      where: { businessId: ctx.businessId, forMonth: month },
      _sum: { amount: true },
    }),
  ]);

  const paidMap = new Map(paidGroups.map((g) => [g.employeeId, Number(g._sum.amount ?? 0)]));

  const dto: EmployeeDTO[] = employees.map((e) => ({
    id: e.id,
    name: e.name,
    phone: e.phone,
    role: e.role,
    salary: Number(e.salary),
    paidThisMonth: paidMap.get(e.id) ?? 0,
  }));

  const monthlyWage = dto.reduce((s, e) => s + e.salary, 0);
  const paidThisMonth = dto.reduce((s, e) => s + e.paidThisMonth, 0);

  return (
    <main className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          {dto.length} staff · monthly wage bill {bdt(monthlyWage)} · paid this month{" "}
          {bdt(paidThisMonth)}
        </p>
      </div>
      <PayrollClient employees={dto} month={month} />
    </main>
  );
}
