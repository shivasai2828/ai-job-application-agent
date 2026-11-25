import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_BTN =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50";

function getPageItems(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const items = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) items.push("…");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < pages - 1) items.push("…");
  items.push(pages);
  return items;
}

export default function Pagination({
  page = 1,
  pages = 1,
  total = 0,
  limit = 20,
  onPageChange,
  disabled = false,
  className,
}) {
  if (!total) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const go = (p) => {
    if (disabled || p < 1 || p > pages || p === page) return;
    onPageChange?.(p);
  };

  return (
    <div className={cn("flex flex-col items-center justify-between gap-3 sm:flex-row", className)}>
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{from}–{to}</span> of{" "}
        <span className="font-medium text-gray-700">{total}</span>
      </p>

      {pages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            onClick={() => go(page - 1)}
            disabled={disabled || page <= 1}
            aria-label="Previous page"
            className={cn(NAV_BTN, "border-gray-300 bg-white text-gray-600 hover:bg-gray-50")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {getPageItems(page, pages).map((item, i) =>
            item === "…" ? (
              <span key={`dots-${i}`} className="px-1.5 text-gray-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => go(item)}
                disabled={disabled}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  NAV_BTN,
                  item === page
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={disabled || page >= pages}
            aria-label="Next page"
            className={cn(NAV_BTN, "border-gray-300 bg-white text-gray-600 hover:bg-gray-50")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
