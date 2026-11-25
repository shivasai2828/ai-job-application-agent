"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export default function Toggle({ checked, onChange, label, disabled = false, className }) {
  const id = useId();

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "bg-indigo-600" : "bg-gray-300"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
      {label && (
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
    </div>
  );
}
