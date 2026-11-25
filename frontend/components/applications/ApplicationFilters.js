"use client";

import { Check } from "lucide-react";
import { APPLICATION_STATUSES, SORT_OPTIONS, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export default function ApplicationFilters({
  search,
  onSearchChange,
  statuses,
  onToggleStatus,
  sort,
  onSortChange,
  from,
  onFromChange,
  to,
  onToChange,
  hasActive,
  onClear,
}) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
        <Input
          label="Search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Company, role or HR email"
        />
        <Select label="Sort by" value={sort} onChange={(e) => onSortChange(e.target.value)} options={SORT_OPTIONS} />
        <Input
          label="From date"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => onFromChange(e.target.value)}
        />
        <Input
          label="To date"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Status</span>
          {hasActive && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear filters
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {APPLICATION_STATUSES.map((s) => {
            const active = statuses.includes(s);
            const meta = STATUS_META[s];
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleStatus(s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                  active ? meta.badge : "bg-white text-gray-600 ring-gray-300 hover:bg-gray-50"
                )}
              >
                {active ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden="true" />
                )}
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
