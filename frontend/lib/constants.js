export const DEFAULT_PAGE_SIZE = 20;

export const APPLICATION_STATUSES = [
  "draft",
  "sending",
  "sent",
  "follow_up_1_sent",
  "follow_up_2_sent",
  "replied",
  "interview",
  "rejected",
  "closed",
  "failed",
];

export const STATUS_META = {
  draft: { label: "Draft", badge: "bg-gray-100 text-gray-700 ring-gray-300", dot: "bg-gray-400" },
  sending: { label: "Sending", badge: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  sent: { label: "Sent", badge: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  follow_up_1_sent: { label: "Follow-up 1 sent", badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  follow_up_2_sent: { label: "Follow-up 2 sent", badge: "bg-orange-50 text-orange-700 ring-orange-200", dot: "bg-orange-500" },
  replied: { label: "Replied", badge: "bg-green-50 text-green-700 ring-green-200", dot: "bg-green-500" },
  interview: { label: "Interview", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  closed: { label: "Closed", badge: "bg-slate-100 text-slate-700 ring-slate-300", dot: "bg-slate-500" },
  failed: { label: "Failed", badge: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
};

// Fields fully editable only in these statuses
export const EDITABLE_STATUSES = ["draft", "failed"];

// Statuses where follow-ups are active / manual status buttons are shown
export const ACTIVE_FOLLOWUP_STATUSES = ["sent", "follow_up_1_sent", "follow_up_2_sent"];

export const MANUAL_STATUS_ACTIONS = [
  { status: "replied", label: "Mark Replied", confirm: "Mark this application as replied? Follow-ups will stop." },
  { status: "interview", label: "Interview", confirm: "Move this application to Interview? Follow-ups will stop." },
  { status: "rejected", label: "Rejected", confirm: "Mark this application as rejected? Follow-ups will stop." },
  { status: "closed", label: "Close", confirm: "Close this application? Follow-ups will stop." },
];

export const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "-sentAt", label: "Recently sent" },
  { value: "sentAt", label: "Sent (oldest first)" },
  { value: "nextFollowUpAt", label: "Next follow-up (soonest)" },
  { value: "-nextFollowUpAt", label: "Next follow-up (latest)" },
  { value: "company", label: "Company A-Z" },
  { value: "-company", label: "Company Z-A" },
];

export const TEMPLATE_TYPES = [
  { value: "application", label: "Application" },
  { value: "follow_up_1", label: "Follow-up 1" },
  { value: "follow_up_2", label: "Follow-up 2" },
];

export const ROLE_TYPES = [
  { value: "fullstack", label: "Full-stack" },
  { value: "agent", label: "Agent / AI" },
  { value: "general", label: "General" },
];

export const EMAIL_LOG_LABELS = {
  application: "Application",
  follow_up_1: "Follow-up 1",
  follow_up_2: "Follow-up 2",
};

export const TEMPLATE_VARIABLES = [
  "{{hr_name}}",
  "{{company}}",
  "{{role}}",
  "{{your_name}}",
  "{{phone}}",
  "{{linkedin}}",
  "{{github}}",
  "{{portfolio}}",
];

// Used by the "suggest template from job description" rule
export const AGENT_KEYWORDS = ["langchain", "langgraph", "agent", "agentic", "rag", "llm", "openai"];

export const ACCEPTED_RESUME_TYPES = ".pdf,.doc,.docx";
export const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB

// React Query keys (use these everywhere so invalidation stays consistent)
export const QUERY_KEYS = {
  applications: "applications",
  application: "application",
  applicationPreview: "application-preview",
  stats: "application-stats",
  templates: "templates",
  template: "template",
  resumes: "resumes",
  settings: "settings",
};
