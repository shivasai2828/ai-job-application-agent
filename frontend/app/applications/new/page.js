"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateApplication } from "@/hooks/useApplications";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ApplicationForm from "@/components/applications/ApplicationForm";
import DuplicatesWarning from "@/components/applications/DuplicatesWarning";

export default function NewApplicationPage() {
  const router = useRouter();
  const create = useCreateApplication();

  const [saved, setSaved] = useState(null); // { application, duplicates, intent } when duplicates were found
  const [redirecting, setRedirecting] = useState(false); // blocks double-submit while navigating

  const goToDetail = ({ application, intent }) => {
    setRedirecting(true);
    router.push(`/applications/${application._id}${intent === "preview" ? "?preview=1" : ""}`);
  };

  const handleSubmit = async (payload, intent) => {
    try {
      const { application, duplicates } = await create.mutateAsync(payload);
      if (duplicates.length > 0) {
        setRedirecting(true);
        setSaved({ application, duplicates, intent });
      } else {
        goToDetail({ application, intent });
      }
    } catch {
      // error toast is shown by the axios interceptor
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="New application"
        description="Add a job, then save it as a draft or preview the email right away"
        backHref="/applications"
        backLabel="All applications"
      />

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <ApplicationForm mode="create" submitting={create.isPending || redirecting} onSubmit={handleSubmit} />
      </div>

      {/* Saved, but a similar application already exists */}
      <Modal
        open={Boolean(saved)}
        onClose={() => saved && goToDetail(saved)}
        title="Application saved"
        description="One thing before you continue"
        footer={
          <Button onClick={() => saved && goToDetail(saved)}>
            {saved?.intent === "preview" ? "Continue to preview" : "Open application"}
          </Button>
        }
      >
        <DuplicatesWarning duplicates={saved?.duplicates} />
      </Modal>
    </div>
  );
}
