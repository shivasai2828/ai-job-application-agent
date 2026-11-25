import { TriangleAlert } from "lucide-react";
import { formatDate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";

export default function DuplicatesWarning({ duplicates = [] }) {
  if (!duplicates.length) return null;

  return (
    <div role="alert" className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
      <div className="flex gap-3">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-yellow-900">
            You already applied to this HR email/company
          </p>
          <ul className="mt-3 space-y-3">
            {duplicates.map((d, i) => (
              <li key={`${d.hrEmail}-${d.createdAt}-${i}`} className="text-sm text-yellow-900">
                <p className="break-words">
                  <span className="font-medium">{d.company}</span> · {d.role} · {d.hrEmail}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={d.status} />
                  <span className="text-xs text-yellow-800">{formatDate(d.createdAt, "dd MMM yyyy")}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
