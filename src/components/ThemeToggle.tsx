"use client";

import { useEffect, useState } from "react";

export function ThemeToggle({ variant = "full" }: { variant?: "full" | "icon" }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme");
    setTheme(t === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  const isDark = theme === "dark";
  const label = isDark ? "Light mode" : "Dark mode";
  const glyph = isDark ? "☀️" : "🌙";

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        aria-label={label}
        title={label}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-base hover:bg-black/5 dark:hover:bg-white/10 transition"
      >
        {glyph}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition"
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 text-base">
        {glyph}
      </span>
      {label}
    </button>
  );
}
