import { Check, Clock } from "lucide-react";
import { ACTIVE_FOLLOWUP_STATUSES, STATUS_META } from "@/lib/constants";
import { cn, formatDate, timeFromNow } from "@/lib/utils";

const STOPPED_STATUSES = ["replied", "interview", "rejected", "closed"];

export default function FollowUpStepper({ application }) {
  const { status, sentAt, followUpStage, followUpsEnabled, nextFollowUpAt, emailLogs = [] } = application;
  const stage = followUpStage || 0;

  const isActive = ACTIVE_FOLLOWUP_STATUSES.includes(status) && Boolean(followUpsEnabled) && stage < 2;
  const nextIndex = isActive ? stage + 1 : -1; // 0 = application, 1 = follow-up 1, 2 = follow-up 2
  const logDate = (type) => emailLogs.find((l) => l.type === type)?.sentAt;

  const steps = [
    { label: "Application", done: Boolean(sentAt), date: sentAt || logDate("application") },
    { label: "Follow-up 1", done: stage >= 1, date: logDate("follow_up_1") },
    { label: "Follow-up 2", done: stage >= 2, date: logDate("follow_up_2") },
  ];

  let note;
  if (status === "draft" || status === "failed") {
    note = "Follow-ups start after the application email is sent.";
  } else if (status === "sending") {
    note = "Sending the application email…";
  } else if (STOPPED_STATUSES.includes(status)) {
    note = `Follow-ups stopped. Status: ${STATUS_META[status]?.label || status}.`;
  } else if (!followUpsEnabled) {
    note = "Auto follow-ups are paused for this application.";
  } else if (stage >= 2) {
    note = "Both follow-ups have been sent.";
  } else if (nextFollowUpAt) {
    note = (
      <>
        Next follow-up ({stage + 1}): <span className="font-medium text-gray-900">{timeFromNow(nextFollowUpAt)}</span>{" "}
        <span className="text-gray-500">({formatDate(nextFollowUpAt)})</span>
      </>
    );
  } else {
    note = "Next follow-up is not scheduled yet.";
  }

  return (
    <div>
      <ol className="flex items-start">
        {steps.map((step, i) => {
          const isNext = i === nextIndex;
          return (
            <li key={step.label} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute right-1/2 top-[15px] h-0.5 w-full",
                    step.done ? "bg-emerald-500" : "bg-gray-200"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  step.done && "border-emerald-500 bg-emerald-500 text-white",
                  isNext && "border-amber-500 bg-amber-50 text-amber-600",
                  !step.done && !isNext && "border-gray-300 bg-white text-gray-400"
                )}
              >
                {step.done ? <Check className="h-4 w-4" /> : isNext ? <Clock className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn("mt-2 text-xs font-medium", step.done || isNext ? "text-gray-900" : "text-gray-500")}>
                {step.label}
              </span>
              <span className="mt-0.5 min-h-4 text-[11px] text-gray-500">
                {step.done && step.date ? formatDate(step.date, "dd MMM, h:mm a") : isNext ? "Up next" : ""}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">{note}</p>
    </div>
  );
}
