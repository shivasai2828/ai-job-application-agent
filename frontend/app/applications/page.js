"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Plus, SearchX } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import useDebounce from "@/hooks/useDebounce";
import { APPLICATION_STATUSES, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { cn, getErrorMessage } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Spinner from "@/components/ui/Spinner";
import ApplicationFilters from "@/components/applications/ApplicationFilters";
import ApplicationTable, { ApplicationListSkeleton } from "@/components/applications/ApplicationTable";

const DEFAULT_SORT = "-createdAt";

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<Spinner centered label="Loading…" />}>
      <ApplicationsRoute />
    </Suspense>
  );
}

// Reads ?status=sent,draft (from dashboard links). The `key` remounts the list
// when the URL changes, so filters re-initialize from the new URL.
function ApplicationsRoute() {
  const searchParams = useSearchParams();
  const initialStatuses = (searchParams.get("status") || "")
    .split(",")
    .filter((s) => APPLICATION_STATUSES.includes(s));

  return <ApplicationsContent key={searchParams.toString()} initialStatuses={initialStatuses} />;
}

function ApplicationsContent({ initialStatuses }) {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [statuses, setStatuses] = useState(initialStatuses);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const search = useDebounce(searchInput, 400);

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useApplications({
    status: statuses,
    search: search.trim(),
    from,
    to,
    page,
    limit: DEFAULT_PAGE_SIZE,
    sort,
  });

  const items = data?.items || [];
  const pagination = data?.pagination || { page, limit: DEFAULT_PAGE_SIZE, total: items.length, pages: 1 };
  const hasActive = Boolean(searchInput || statuses.length || from || to);

  const resetPage = () => setPage(1);

  const handleSearch = (value) => {
    setSearchInput(value);
    resetPage();
  };
  const toggleStatus = (s) => {
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    resetPage();
  };
  const handleSort = (value) => {
    setSort(value);
    resetPage();
  };
  const handleFrom = (value) => {
    setFrom(value);
    resetPage();
  };
  const handleTo = (value) => {
    setTo(value);
    resetPage();
  };
  const clearFilters = () => {
    setSearchInput("");
    setStatuses([]);
    setFrom("");
    setTo("");
    resetPage();
  };
  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNew = () => router.push("/applications/new");

  return (
    <div>
      <PageHeader
        title="Applications"
        description={data ? `${pagination.total} total` : "Everything you've sent and tracked"}
        actions={
          <Button icon={Plus} onClick={goNew}>
            New Application
          </Button>
        }
      />

      <div className="space-y-4">
        <ApplicationFilters
          search={searchInput}
          onSearchChange={handleSearch}
          statuses={statuses}
          onToggleStatus={toggleStatus}
          sort={sort}
          onSortChange={handleSort}
          from={from}
          onFromChange={handleFrom}
          to={to}
          onToChange={handleTo}
          hasActive={hasActive}
          onClear={clearFilters}
        />

        {isError ? (
          <ErrorState title="Couldn't load applications" message={getErrorMessage(error)} onRetry={refetch} />
        ) : isLoading ? (
          <ApplicationListSkeleton />
        ) : items.length === 0 ? (
          hasActive ? (
            <EmptyState
              icon={SearchX}
              title="No applications match your filters"
              description="Try a different search, or clear the filters."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No applications yet"
              description="Add your first job application, preview the email and send it."
              action={
                <Button icon={Plus} onClick={goNew}>
                  New Application
                </Button>
              }
            />
          )
        ) : (
          <div className={cn("space-y-4 transition-opacity", isPlaceholderData && "opacity-60")}>
            <ApplicationTable items={items} />
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={handlePageChange}
              disabled={isPlaceholderData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
