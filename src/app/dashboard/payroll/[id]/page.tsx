import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await requireTenant();

  const employee = await prisma.employee.findFirst({
    where: { id, businessId: ctx.businessId },
    include: { payments: { orderBy: { paidAt: "desc" } } },
  });
  if (!employee) notFound();

  const totalPaid = employee.payments.reduce((s, p) => s + Number(p.amount), 0);
  const monthsPaid = new Set(employee.payments.map((p) => p.forMonth)).size;

  return (
    <main className="p-5 sm:p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/payroll" className="text-sm text-black/50 dark:text-white/50">
        ← Payroll
      </Link>

      <div className="mt-3 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center text-white text-lg font-semibold">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{employee.name}</h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              {employee.role ?? "Staff"} · {employee.phone ?? "no phone"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{bdt(employee.salary)}</div>
            <div className="text-xs text-black/50 dark:text-white/50">monthly salary</div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Total paid", value: bdt(totalPaid) },
            { label: "Payments", value: `${employee.payments.length}` },
            { label: "Months paid", value: `${monthsPaid}` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-black/[.03] dark:bg-white/[.04] p-3">
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-xs text-black/50 dark:text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mt-8 font-semibold">Payment history</h2>
      {employee.payments.length === 0 ? (
        <p className="mt-3 text-sm text-black/50 dark:text-white/50">No payments yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.03] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Paid on</th>
                <th className="px-4 py-3 font-medium">For month</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {employee.payments.map((p) => (
                <tr key={p.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3">{p.paidAt.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3">{p.forMonth}</td>
                  <td className="px-4 py-3 text-black/60 dark:text-white/60">{p.note ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">{bdt(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
