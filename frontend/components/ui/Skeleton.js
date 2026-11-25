import { cn } from "@/lib/utils";

export default function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} aria-hidden="true" />;
}
