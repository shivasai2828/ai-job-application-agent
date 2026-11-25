import { ROLE_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STYLES = {
  fullstack: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  agent: "bg-violet-50 text-violet-700 ring-violet-200",
  general: "bg-gray-100 text-gray-700 ring-gray-300",
};

export default function RoleBadge({ roleType, className }) {
  if (!roleType) return null;
  const label = ROLE_TYPES.find((r) => r.value === roleType)?.label || roleType;

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STYLES[roleType] || STYLES.general,
        className
      )}
    >
      {label}
    </span>
  );
}
