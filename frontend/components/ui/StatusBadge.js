import { STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function StatusBadge({ status, className }) {
  const meta = STATUS_META[status] || {
    label: status || "Unknown",
    badge: "bg-gray-100 text-gray-700 ring-gray-300",
    dot: "bg-gray-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        meta.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
