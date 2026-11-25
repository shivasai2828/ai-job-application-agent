import { cn } from "@/lib/utils";

// Shared look for input / textarea / select
export function fieldClass(hasError) {
  return cn(
    "block w-full rounded-lg border bg-white px-3 text-sm text-gray-900 shadow-sm",
    "placeholder:text-gray-400 focus:outline-none focus:ring-2",
    "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
  );
}

export function describedBy(id, error, hint) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export default function Field({ id, label, required, error, hint, className, children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
