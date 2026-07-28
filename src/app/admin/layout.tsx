import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { logoutAction } from "../(auth)/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-5 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <Link href="/admin" className="flex items-center gap-2 font-bold">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center text-sm">
            ★
          </span>
          Super-admin
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-black/50 dark:text-white/50">{admin.email}</span>
          <form action={logoutAction}>
            <button className="rounded-lg border border-black/15 dark:border-white/20 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10">
              Logout
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
