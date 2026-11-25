import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };

export default function Spinner({ size = "md", label, centered = false, className }) {
  const spinner = (
    <span role="status" className={cn("inline-flex items-center gap-2 text-indigo-600", className)}>
      <LoaderCircle className={cn("animate-spin", SIZES[size])} aria-hidden="true" />
      {label ? <span className="text-sm text-gray-500">{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  );

  return centered ? <div className="flex justify-center py-12">{spinner}</div> : spinner;
}
