import Link from "next/link";
import { DateFilter } from "./DateFilter";
import { ReportActions } from "./ReportActions";

export function ReportHeader({
  businessName,
  title,
  type,
  from,
  to,
  back = true,
}: {
  businessName: string;
  title: string;
  type: string;
  from: string;
  to: string;
  back?: boolean;
}) {
  return (
    <div>
      {back && (
        <Link href="/dashboard/reports" className="no-print text-sm text-black/50 dark:text-white/50">
          ← All reports
        </Link>
      )}

      {/* Print-only heading */}
      <div className="hidden print:block mb-4">
        <div className="text-xl font-bold">{businessName}</div>
        <div className="text-sm">
          {title} — {from} to {to}
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold no-print">{title}</h1>
        <ReportActions type={type} from={from} to={to} />
      </div>

      <div className="mt-3">
        <DateFilter from={from} to={to} />
      </div>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50 no-print">
        {from} → {to}
      </p>
    </div>
  );
}
