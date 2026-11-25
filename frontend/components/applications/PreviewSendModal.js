"use client";

import { useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { useApplicationPreview, useSendApplication } from "@/hooks/useApplications";
import { getErrorMessage } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorState from "@/components/ui/ErrorState";
import Spinner from "@/components/ui/Spinner";

// The inner component only exists while the modal is open, so its state
// (edits, confirm dialog) resets automatically every time you open it.
export default function PreviewSendModal({ applicationId, open, onClose }) {
  if (!open) return null;
  return <PreviewSendModalInner applicationId={applicationId} onClose={onClose} />;
}

function PreviewSendModalInner({ applicationId, onClose }) {
  const { data, isLoading, isError, error, refetch } = useApplicationPreview(applicationId, true);
  const send = useSendApplication();

  // null = untouched (show what the server generated)
  const [edits, setEdits] = useState({ subject: null, body: null });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const subject = edits.subject ?? data?.subject ?? "";
  const body = edits.body ?? data?.body ?? "";
  const edited = edits.subject !== null || edits.body !== null;
  const canSend = Boolean(data && subject.trim() && body.trim());

  const handleSend = () => {
    // Only send subject/body if the preview was edited
    const vars = edited ? { id: applicationId, subject, body } : { id: applicationId };
    send.mutate(vars, {
      onSuccess: () => {
        setConfirmOpen(false);
        onClose();
      },
      // 429 / 400 / 502: toast comes from the interceptor. Keep the modal open so you can retry.
      onError: () => setConfirmOpen(false),
    });
  };

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title="Preview & send"
        description="Review the email before it goes out"
        size="xl"
        dismissible={!send.isPending}
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={send.isPending}>
              Cancel
            </Button>
            <Button
              icon={Send}
              onClick={() => setConfirmOpen(true)}
              disabled={!canSend}
              loading={send.isPending}
            >
              Send Email
            </Button>
          </>
        }
      >
        {isLoading ? (
          <Spinner centered label="Generating preview…" />
        ) : isError ? (
          <ErrorState title="Couldn't load preview" message={getErrorMessage(error)} onRetry={refetch} />
        ) : data ? (
          <div className="space-y-4">
            <Input label="To" value={data.to || ""} disabled readOnly />

            <Input
              label="Subject"
              required
              value={subject}
              onChange={(e) => setEdits((prev) => ({ ...prev, subject: e.target.value }))}
              error={!subject.trim() ? "Subject can't be empty" : undefined}
            />

            <Textarea
              label="Body"
              required
              rows={14}
              value={body}
              onChange={(e) => setEdits((prev) => ({ ...prev, body: e.target.value }))}
              error={!body.trim() ? "Body can't be empty" : undefined}
              hint={edited ? "Your edits apply to this send only. The template is unchanged." : undefined}
            />

            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
              <Paperclip className="h-4 w-4 shrink-0 text-gray-400" />
              {data.resume ? (
                <span className="min-w-0 truncate">
                  <span className="font-medium">{data.resume.label}</span>
                  {data.resume.fileName ? (
                    <span className="text-gray-500"> · {data.resume.fileName}</span>
                  ) : null}
                </span>
              ) : (
                <span className="text-amber-700">No resume attached</span>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSend}
        title="Send this email now?"
        message={
          <>
            This will email <span className="font-medium text-gray-900">{data?.to}</span> from your Gmail with the
            resume attached, and schedule the follow-ups. It can&apos;t be undone.
          </>
        }
        confirmLabel="Send now"
        loading={send.isPending}
      />
    </>
  );
}
