import { format, formatDistanceToNow, isValid } from "date-fns";
import { AGENT_KEYWORDS } from "./constants";

// NOTE: this is a plain join (no tailwind-merge), so don't pass conflicting
// classes like "bg-white" and "bg-indigo-600" together.
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isValid(d) ? d : null;
}

export function formatDate(value, pattern = "dd MMM yyyy, h:mm a") {
  const d = toDate(value);
  return d ? format(d, pattern) : "—";
}

// "in about 3 hours" / "2 days ago"
export function timeFromNow(value) {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}

export function formatBytes(bytes) {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(value) {
  return EMAIL_RE.test(String(value || "").trim());
}

// Simple keyword rule: AI/agent-ish JD -> "agent", else "fullstack"
const AGENT_RE = new RegExp(`\\b(${AGENT_KEYWORDS.join("|")})s?\\b`, "i");
export function suggestRoleType(jobDescription = "") {
  return AGENT_RE.test(jobDescription) ? "agent" : "fullstack";
}

export function getErrorMessage(error, fallback = "Something went wrong") {
  return error?.userMessage || error?.response?.data?.message || error?.message || fallback;
}

export function truncate(text = "", max = 80) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// For the "variable chips" in the template editor.
// Returns the new string + where the cursor should go.
export function insertAtCursor(el, text, currentValue = "") {
  const start = el?.selectionStart ?? currentValue.length;
  const end = el?.selectionEnd ?? currentValue.length;
  return {
    value: currentValue.slice(0, start) + text + currentValue.slice(end),
    cursor: start + text.length,
  };
}

// Trigger a browser download from a Blob (resume download)
export function downloadBlob(blob, filename = "download") {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Drops empty values and joins arrays with commas, for axios `params`
export function cleanParams(params = {}) {
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      if (value.length) out[key] = value.join(",");
      return;
    }
    out[key] = value;
  });
  return out;
}

// Works whether the API gives you a populated object or a plain id string
export function idOf(value) {
  return (value && typeof value === "object" ? value._id : value) || "";
}

