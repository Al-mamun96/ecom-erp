import { requireTenant } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireTenant();

  return (
    <div className="lg:flex min-h-screen bg-zinc-50 dark:bg-black text-[var(--foreground)]">
      <Sidebar businessName={user.business!.name} userName={user.name} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
