"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Select = { name: string; value: string; options: { value: string; label: string }[] };

export function Filters({
  searchName = "q",
  searchPlaceholder = "Search…",
  searchValue = "",
  selects = [],
}: {
  searchName?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  selects?: Select[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function push(next: URLSearchParams) {
    const s = next.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams(params.toString());
    const v = String(fd.get(searchName) ?? "").trim();
    if (v) next.set(searchName, v);
    else next.delete(searchName);
    push(next);
  }

  function onSelect(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    push(next);
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <input
          name={searchName}
          defaultValue={searchValue}
          placeholder={searchPlaceholder}
          className="rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-foreground w-52"
        />
        <button className="rounded-lg bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:opacity-90">
          Search
        </button>
      </form>

      {selects.map((s) => (
        <select
          key={s.name}
          value={s.value}
          onChange={(e) => onSelect(s.name, e.target.value)}
          className="rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2.5 py-1.5 text-sm"
        >
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
