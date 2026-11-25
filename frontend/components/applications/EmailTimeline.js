"use client";

import { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { EMAIL_LOG_LABELS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

function TimelineItem({ log }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="relative">
      <span className="absolute -left-[34px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 ring-4 ring-white">
        <Mail className="h-3 w-3" />
      </span>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-gray-900">{EMAIL_LOG_LABELS[log.type] || log.type}</span>
        <span className="text-xs text-gray-500">{formatDate(log.sentAt)}</span>
      </div>
      <p className="mt-0.5 break-words text-sm text-gray-600">{log.subject}</p>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
      >
        {open ? "Hide email" : "Show email"}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-3 font-sans text-sm text-gray-700">
          {log.body}
        </pre>
      )}
    </li>
  );
}

export default function EmailTimeline({ logs = [] }) {
  const sorted = [...logs].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-500">No emails sent yet.</p>;
  }

  return (
    <ol className="relative space-y-6 border-l border-gray-200 pl-6">
      {sorted.map((log, i) => (
        <TimelineItem key={log._id || `${log.type}-${i}`} log={log} />
      ))}
    </ol>
  );
}
