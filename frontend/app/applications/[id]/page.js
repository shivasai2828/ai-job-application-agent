"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Pencil, Send, Trash2, TriangleAlert } from "lucide-react";
import {
  useApplication,
  useDeleteApplication,
  useToggleFollowUps,
  useUpdateApplication,
  useUpdateApplicationStatus,
} from "@/hooks/useApplications";
import { ACTIVE_FOLLOWUP_STATUSES, EDITABLE_STATUSES, MANUAL_STATUS_ACTIONS } from "@/lib/constants";
import { cn, formatDate, getErrorMessage, idOf } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import Spinner from "@/components/ui/Spinner";
import Toggle from "@/components/ui/Toggle";
import ApplicationForm from "@/components/applications/ApplicationForm";
import PreviewSendModal from "@/components/applications/PreviewSendModal";
import FollowUpStepper from "@/components/applications/FollowUpStepper";
import EmailTimeline from "@/components/applications/EmailTimeline";

const CARD = "rounded-xl border border-gray-200 bg-white shadow-sm";

export default function ApplicationDetailPage() {
  return (
    <Suspense fallback={<Spinner centered label="Loading…" />}>
      <ApplicationDetail />
    </Suspense>
  );
}

function Detail({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-gray-900">{children || <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function ApplicationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: app, isLoading, isError, error, refetch } = useApplication(id);
  const updateMut = useUpdateApplication();
  const deleteMut = useDeleteApplication();
  const statusMut = useUpdateApplicationStatus();
  const followMut = useToggleFollowUps();

  // "Save & Preview" lands here with ?preview=1
  const [previewOpen, setPreviewOpen] = useState(() => searchParams.get("preview") === "1");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const editRef = useRef(null);

  // Strip ?preview=1 so a page refresh doesn't re-open the modal
  useEffect(() => {
    if (searchParams.get("preview")) router.replace(pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !app) {
    return (
      <div>
        <PageHeader title="Application" backHref="/applications" backLabel="All applications" />
        <ErrorState
          title="Couldn't load this application"
          message={getErrorMessage(error, "Application not found")}
          onRetry={refetch}
        />
      </div>
    );
  }

  const canEdit = EDITABLE_STATUSES.includes(app.status); // draft / failed
  const isActiveStatus = ACTIVE_FOLLOWUP_STATUSES.includes(app.status); // sent / follow_up_1_sent / follow_up_2_sent
  const followChecked = followMut.isPending ? Boolean(followMut.variables?.enabled) : Boolean(app.followUpsEnabled);

  const initialValues = {
    company: app.company || "",
    role: app.role || "",
    hrName: app.hrName || "",
    hrEmail: app.hrEmail || "",
    jobUrl: app.jobUrl || "",
    jobDescription: app.jobDescription || "",
    notes: app.notes || "",
    template: idOf(app.template),
    resume: idOf(app.resume),
  };

  const scrollToEdit = () => {
    editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    editRef.current?.querySelector("input:not([disabled])")?.focus({ preventScroll: true });
  };

  const handleSave = (payload) => updateMut.mutate({ id: app._id, ...payload });

  const headerActions = canEdit ? (
    <>
      <Button icon={Send} onClick={() => setPreviewOpen(true)}>
        Preview & Send
      </Button>
      <Button variant="secondary" icon={Pencil} onClick={scrollToEdit}>
        Edit
      </Button>
      <Button variant="danger" icon={Trash2} onClick={() => setConfirmDelete(true)}>
        Delete
      </Button>
    </>
  ) : isActiveStatus ? (
    MANUAL_STATUS_ACTIONS.map((action) => (
      <Button
        key={action.status}
        variant={action.status === "replied" ? "success" : "secondary"}
        onClick={() => setPendingStatus(action)}
      >
        {action.label}
      </Button>
    ))
  ) : null;

  return (
    <div>
      <PageHeader
        backHref="/applications"
        backLabel="All applications"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {app.company}
            <StatusBadge status={app.status} />
          </span>
        }
        description={app.role}
        actions={headerActions}
      />

      {app.status === "failed" && app.lastError && (
        <div role="alert" className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-900">Last send failed</p>
            <p className="mt-0.5 break-words text-sm text-red-700">{app.lastError}</p>
          </div>
        </div>
      )}

      {app.status === "sending" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <Spinner size="sm" />
          Sending the email… this page refreshes automatically.
        </div>
      )}

      <div className="space-y-6">
        {/* Overview */}
        <section className={cn(CARD, "p-5")}>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="HR">
              {app.hrName ? <p>{app.hrName}</p> : null}
              <a href={`mailto:${app.hrEmail}`} className="text-indigo-600 hover:underline">
                {app.hrEmail}
              </a>
            </Detail>
            <Detail label="Job URL">
              {app.jobUrl ? (
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 text-indigo-600 hover:underline"
                >
                  <span className="truncate">{app.jobUrl}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ) : null}
            </Detail>
            <Detail label="Sent">{app.sentAt ? formatDate(app.sentAt) : null}</Detail>
            {app.repliedAt && <Detail label="Replied">{formatDate(app.repliedAt)}</Detail>}
            <Detail label="Template">{app.template?.name}</Detail>
            <Detail label="Resume">{app.resume?.label}</Detail>
            <Detail label="Created">{formatDate(app.createdAt)}</Detail>
          </dl>
        </section>

        {/* Follow-up tracker */}
        <section className={cn(CARD, "p-5")}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Follow-up tracker</h2>
            {isActiveStatus && (
              <Toggle
                label="Auto follow-ups"
                checked={followChecked}
                disabled={followMut.isPending}
                onChange={(enabled) => followMut.mutate({ id: app._id, enabled })}
              />
            )}
          </div>
          <FollowUpStepper application={app} />
        </section>

        {/* Email history */}
        <section className={cn(CARD, "p-5")}>
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Email history</h2>
          <EmailTimeline logs={app.emailLogs || []} />
        </section>

        {/* Edit */}
        <section ref={editRef} className={cn(CARD, "scroll-mt-20 p-5")}>
          <h2 className="text-sm font-semibold text-gray-900">Edit details</h2>
          <p className="mb-5 mt-0.5 text-xs text-gray-500">
            {canEdit
              ? "Everything is editable while this application is a draft or has failed."
              : "Company, role, HR email, template and resume are locked once the email has been sent."}
          </p>
          <ApplicationForm
            key={app._id}
            mode="edit"
            coreEditable={canEdit}
            initialValues={initialValues}
            currentTemplateName={app.template?.name}
            submitting={updateMut.isPending}
            onSubmit={handleSave}
          />
        </section>
      </div>

      <PreviewSendModal applicationId={app._id} open={previewOpen && canEdit} onClose={() => setPreviewOpen(false)} />

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        onConfirm={() =>
          statusMut.mutate(
            { id: app._id, status: pendingStatus.status },
            { onSettled: () => setPendingStatus(null) }
          )
        }
        title={pendingStatus?.label}
        message={pendingStatus?.confirm}
        confirmLabel="Yes, continue"
        loading={statusMut.isPending}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMut.mutate(app._id, {
            onSuccess: () => router.push("/applications"),
            onError: () => setConfirmDelete(false),
          })
        }
        title="Delete application?"
        message={`This permanently deletes the application for ${app.company}. This can't be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
