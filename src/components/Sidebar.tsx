"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./icons";
import { logoutAction } from "@/app/(auth)/actions";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  color: string; // tailwind text color for the icon chip
  soon?: boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "grid", color: "text-indigo-500 bg-indigo-500/10" },
  { href: "/dashboard/orders", label: "Orders", icon: "bag", color: "text-blue-500 bg-blue-500/10" },
  { href: "/dashboard/products", label: "Products", icon: "box", color: "text-amber-500 bg-amber-500/10" },
  { href: "/dashboard/customers", label: "Customers", icon: "users", color: "text-emerald-500 bg-emerald-500/10" },
  { href: "/dashboard/courier", label: "Courier", icon: "truck", color: "text-orange-500 bg-orange-500/10", soon: true },
  { href: "/dashboard/accounts", label: "Accounts", icon: "wallet", color: "text-violet-500 bg-violet-500/10" },
  { href: "/dashboard/payroll", label: "Payroll", icon: "coins", color: "text-rose-500 bg-rose-500/10" },
  { href: "/dashboard/reports", label: "Reports", icon: "chart", color: "text-cyan-500 bg-cyan-500/10" },
];

export function Sidebar({ businessName, userName }: { businessName: string; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-black/10 dark:border-white/10 bg-[var(--background)]/80 backdrop-blur">
        <button onClick={() => setOpen(true)} aria-label="Menu" className="p-1.5">
          <Icon name="menu" />
        </button>
        <span className="font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          {businessName}
        </span>
        <div className="w-8" />
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-50 lg:z-0 h-screen w-64 shrink-0 flex flex-col
          border-r border-black/10 dark:border-white/10
          bg-white dark:bg-zinc-950
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-black/5 dark:border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/25">
            E
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm">Ecom-ERP</div>
            <div className="text-[11px] text-black/40 dark:text-white/40">Business Manager</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const content = (
              <div
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition
                  ${active
                    ? "bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-300"
                    : "text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"}`}
              >
                <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${item.color}`}>
                  <Icon name={item.icon} width={18} height={18} />
                </span>
                <span className="flex-1">{item.label}</span>
                {item.soon && (
                  <span className="text-[10px] text-black/30 dark:text-white/30">Soon</span>
                )}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </div>
            );
            return item.soon ? (
              <div key={item.href} className="cursor-not-allowed opacity-70">
                {content}
              </div>
            ) : (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {content}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-black/5 dark:border-white/5 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-medium truncate">{userName}</div>
              <div className="text-[11px] text-black/40 dark:text-white/40 truncate">{businessName}</div>
            </div>
          </div>
          <form action={logoutAction}>
            <button className="mt-1 w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-black/60 dark:text-white/60 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5">
                <Icon name="logout" width={18} height={18} />
              </span>
              Logout
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
