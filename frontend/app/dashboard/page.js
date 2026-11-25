"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Send, Percent, CalendarClock, Plus } from "lucide-react";
import { useApplicationStats } from "@/hooks/useApplications";
import { APPLICATION_STATUSES, STATUS_META } from "@/lib/constants";
import { cn, formatDate, getErrorMessage, timeFromNow } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";

const CARD = "rounded-xl border border-gray-200 bg-white shadow-sm";

// badge color for "which follow-up is next"
const NEXT_STEP_BADGE = {
  1: "bg-amber-50 text-amber-700 ring-amber-200",
  2: "bg-orange-50 text-orange-700 ring-orange-200",
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading, isError, error, refetch } = useApplicationStats();

  const counts = stats?.counts || {};
  const upcoming = stats?.upcomingFollowUps || [];
  const sentToday = stats?.sentToday ?? 0;
  const limit = stats?.dailySendLimit ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((sentToday / limit) * 100)) : 0;
  const limitReached = limit > 0 && sentToday >= limit;
  const totalForBars = stats?.total || Object.values(counts).reduce((a, b) => a + b, 0);

  const rate = Number(stats?.responseRate ?? 0);
  const rateText = `${Number.isInteger(rate) ? rate : rate.toFixed(1)}%`;

  const goNew = () => router.push("/applications/new");

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your outreach at a glance"
        actions={
          <Button icon={Plus} onClick={goNew}>
            New Application
          </Button>
        }
      />

      {isError ? (
        <ErrorState title="Couldn't load dashboard" message={getErrorMessage(error)} onRetry={refetch} />
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total applications"
              value={stats?.total ?? 0}
              hint={`${stats?.sentTotal ?? 0} sent`}
              icon={Briefcase}
              tone="indigo"
              loading={isLoading}
            />

            <StatCard
              label="Sent today"
              value={limit > 0 ? `${sentToday} / ${limit}` : sentToday}
              hint={limitReached ? "Daily limit reached" : limit > 0 ? `${limit - sentToday} left today` : undefined}
              icon={Send}
              tone={limitReached ? "rose" : "blue"}
              loading={isLoading}
            >
              {limit > 0 && (
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Daily send limit used"
                >
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      limitReached ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-indigo-500"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </StatCard>

            <StatCard
              label="Response rate"
              value={rateText}
              hint={`of ${stats?.sentTotal ?? 0} sent`}
              icon={Percent}
              tone="green"
              loading={isLoading}
            />

            <StatCard
              label="Pending follow-ups"
              value={upcoming.length}
              hint="scheduled"
              icon={CalendarClock}
              tone="amber"
              loading={isLoading}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Upcoming follow-ups */}
            <section className={cn(CARD, "lg:col-span-3")}>
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-900">Upcoming follow-ups</h2>
                <Link href="/applications" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  View all
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-3 p-5">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={CalendarClock}
                    title="No follow-ups scheduled"
                    description="Once you send an application, its follow-ups will show up here."
                    action={
                      <Button size="sm" icon={Plus} onClick={goNew}>
                        New Application
                      </Button>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {upcoming.map((item) => {
                    const nextStep = (item.followUpStage || 0) + 1;
                    return (
                      <li key={item._id}>
                        <Link
                          href={`/applications/${item._id}`}
                          className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">{item.company}</p>
                            <p className="truncate text-xs text-gray-500">
                              {item.role} · {item.hrEmail}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                                NEXT_STEP_BADGE[nextStep] || NEXT_STEP_BADGE[2]
                              )}
                            >
                              Follow-up {nextStep}
                            </span>
                            <p className="mt-1 text-xs text-gray-500" title={formatDate(item.nextFollowUpAt)}>
                              {timeFromNow(item.nextFollowUpAt)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Status breakdown */}
            <section className={cn(CARD, "lg:col-span-2")}>
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-900">Status breakdown</h2>
              </div>

              {isLoading ? (
                <div className="space-y-3 p-5">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <ul className="space-y-3 p-5">
                  {APPLICATION_STATUSES.map((status) => {
                    const n = counts[status] ?? 0;
                    const width = totalForBars > 0 ? Math.max(Math.round((n / totalForBars) * 100), n ? 3 : 0) : 0;
                    return (
                      <li key={status}>
                        <Link href={`/applications?status=${status}`} className="block rounded-md hover:opacity-80">
                          <div className="mb-1.5 flex items-center justify-between">
                            <StatusBadge status={status} />
                            <span className={cn("text-sm font-medium", n ? "text-gray-900" : "text-gray-400")}>
                              {n}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={cn("h-1.5 rounded-full", STATUS_META[status].dot)}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
