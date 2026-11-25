import { cn } from "@/lib/utils";
import Skeleton from "./Skeleton";

const TONES = {
  indigo: "bg-indigo-50 text-indigo-600",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  gray: "bg-gray-100 text-gray-600",
};

// `children` renders below the value (e.g. a progress bar)
export default function StatCard({ label, value, hint, icon: Icon, tone = "indigo", loading = false, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
          )}
          {hint && !loading && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", TONES[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      {!loading && children}
    </div>
  );
}
