"use client";

import { Paperclip } from "lucide-react";
import { useResumes } from "@/hooks/useResumes";
import { getErrorMessage } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import ResumeUploadForm from "@/components/resumes/ResumeUploadForm";
import ResumeList from "@/components/resumes/ResumeList";

const CARD = "rounded-xl border border-gray-200 bg-white shadow-sm";

export default function ResumesPage() {
  const { data: resumes = [], isLoading, isError, error, refetch } = useResumes();

  return (
    <div>
      <PageHeader title="Resumes" description="Upload resumes and pick which one goes out with each application" />

      <div className="space-y-6">
        <section className={`${CARD} p-5`}>
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Upload a resume</h2>
          <ResumeUploadForm />
        </section>

        <section className={CARD}>
          <div className="border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900">
              Your resumes
              {!isLoading && !isError && <span className="ml-2 text-xs font-normal text-gray-500">{resumes.length}</span>}
            </h2>
          </div>

          {isError ? (
            <div className="p-5">
              <ErrorState title="Couldn't load resumes" message={getErrorMessage(error)} onRetry={refetch} />
            </div>
          ) : isLoading ? (
            <div className="space-y-3 p-5" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Paperclip}
                title="No resumes yet"
                description="Upload your first resume above. You need at least one to send an application."
              />
            </div>
          ) : (
            <ResumeList resumes={resumes} />
          )}
        </section>
      </div>
    </div>
  );
}
