"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ACTIVE_FOLLOWUP_STATUSES } from "@/lib/constants";
import { cn, formatDate, timeFromNow } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import Skeleton from "@/components/ui/Skeleton";

const NO_FOLLOWUP_STATUSES = ["draft", "sending", "failed"];

function FollowUpProgress({ app }) {
  if (NO_FOLLOWUP_STATUSES.includes(app.status)) return <span className="text-gray-400">—</span>;
  const stage = app.followUpStage || 0;

  return (
    <span className="inline-flex items-center gap-2" title={`${stage} of 2 follow-ups sent`}>
      <span className="flex gap-1" aria-hidden="true">
        {[1, 2].map((n) => (
          <span key={n} className={cn("h-1.5 w-4 rounded-full", n <= stage ? "bg-amber-500" : "bg-gray-200")} />
        ))}
      </span>
      <span className="text-xs font-medium text-gray-600">{stage}/2</span>
    </span>
  );
}

function NextFollowUp({ app }) {
  if (!ACTIVE_FOLLOWUP_STATUSES.includes(app.status)) return <span className="text-gray-400">—</span>;
  if (app.followUpsEnabled === false) return <span className="text-gray-500">Paused</span>;
  if (!app.nextFollowUpAt) return <span className="text-gray-400">—</span>;
  return <span title={formatDate(app.nextFollowUpAt)}>{timeFromNow(app.nextFollowUpAt)}</span>;
}

const HEADERS = ["Company", "Role", "HR email", "Status", "Sent", "Next follow-up", "Follow-ups"];

export default function ApplicationTable({ items }) {
  const router = useRouter();
  const open = (id) => router.push(`/applications/${id}`);

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((app) => (
                <tr key={app._id} onClick={() => open(app._id)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link
                      href={`/applications/${app._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-indigo-600"
                    >
                      {app.company}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="max-w-[14rem] truncate" title={app.role}>
                      {app.role}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="max-w-[14rem] truncate" title={app.hrEmail}>
                      {app.hrEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {app.sentAt ? formatDate(app.sentAt, "dd MMM yyyy") : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    <NextFollowUp app={app} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <FollowUpProgress app={app} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {items.map((app) => (
          <li key={app._id}>
            <Link
              href={`/applications/${app._id}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{app.company}</p>
                  <p className="truncate text-sm text-gray-600">{app.role}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
              <p className="mt-2 truncate text-xs text-gray-500">{app.hrEmail}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-gray-500">Sent</dt>
                  <dd className="mt-0.5 text-gray-800">{app.sentAt ? formatDate(app.sentAt, "dd MMM") : "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Next</dt>
                  <dd className="mt-0.5 text-gray-800">
                    <NextFollowUp app={app} />
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Follow-ups</dt>
                  <dd className="mt-0.5">
                    <FollowUpProgress app={app} />
                  </dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ApplicationListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
