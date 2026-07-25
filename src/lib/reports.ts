import "server-only";

export type Range = { from: Date; to: Date; fromStr: string; toStr: string };

/** Parse ?from=&to= (YYYY-MM-DD) with a default of the last 30 days. */
export function parseRange(sp: { from?: string; to?: string }): Range {
  const today = new Date();
  const toStr = isDate(sp.to) ? sp.to! : today.toISOString().slice(0, 10);
  const fromDefault = new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10);
  const fromStr = isDate(sp.from) ? sp.from! : fromDefault;
  return {
    fromStr,
    toStr,
    from: new Date(`${fromStr}T00:00:00.000`),
    to: new Date(`${toStr}T23:59:59.999`),
  };
}

function isDate(s?: string) {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export const bdt = (n: unknown) => "৳" + Number(n).toLocaleString("en-US");
export const num = (n: unknown) => Number(n).toLocaleString("en-US");

/** Build a CSV string from a header row + data rows (values auto-quoted). */
export function toCsv(header: string[], rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}

export function csvResponse(filename: string, csv: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
