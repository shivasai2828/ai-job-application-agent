"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Eye, RotateCcw, Save } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { useResumes } from "@/hooks/useResumes";
import useDebounce from "@/hooks/useDebounce";
import { ROLE_TYPES } from "@/lib/constants";
import { idOf, isValidEmail, suggestRoleType } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";

const EMPTY = {
  company: "",
  role: "",
  hrName: "",
  hrEmail: "",
  jobUrl: "",
  jobDescription: "",
  notes: "",
  template: "",
  resume: "",
};
const FIELDS = Object.keys(EMPTY);

const roleLabel = (value) => ROLE_TYPES.find((r) => r.value === value)?.label || value || "";

/**
 * mode="create": two buttons, onSubmit(payload, "draft" | "preview"), template auto-suggest from JD
 * mode="edit":   one button,  onSubmit(payload, "save"). Company/role/HR email/template/resume
 *                are only editable when `coreEditable` is true (draft/failed).
 */
export default function ApplicationForm({
  mode = "create",
  initialValues,
  currentTemplateName,
  coreEditable = true,
  submitting = false,
  onSubmit,
}) {
  const isCreate = mode === "create";
  const formRef = useRef(null);
  const initial = { ...EMPTY, ...initialValues };

  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [templateTouched, setTemplateTouched] = useState(false);
  const [resumeTouched, setResumeTouched] = useState(false);
  const [intent, setIntent] = useState(null);

  const { data: templates = [], isLoading: templatesLoading } = useTemplates({
    type: "application",
    isActive: true,
  });
  const { data: resumes = [], isLoading: resumesLoading } = useResumes();

  /* ---- template suggestion (create mode only, derived, no effects) ---- */
  const debouncedJd = useDebounce(values.jobDescription, 500);
  let suggestedTemplate = null;
  if (isCreate && debouncedJd.trim()) {
    const wanted = suggestRoleType(debouncedJd); // "agent" or "fullstack"
    suggestedTemplate = templates.find((t) => t.roleType === wanted) || null;
  }
  const usingSuggestion = isCreate && !templateTouched && Boolean(suggestedTemplate);
  const templateId = usingSuggestion ? suggestedTemplate._id : values.template;

  /* ---- resume auto-select: template.defaultResume, else the isDefault resume ---- */
  const selectedTemplate = templates.find((t) => t._id === templateId);
  const tplResumeId = idOf(selectedTemplate?.defaultResume);
  const defaultResumeId = resumes.find((r) => r.isDefault)?._id || "";
  const autoResumeId = tplResumeId || defaultResumeId;
  const resumeId = isCreate && !resumeTouched ? autoResumeId : values.resume;

  /* ---- select options ---- */
  const templateOptions = templates.map((t) => ({
    value: t._id,
    label: `${t.name} · ${roleLabel(t.roleType)}`,
  }));
  if (templateId && !templateOptions.some((o) => o.value === templateId)) {
    // e.g. the current template was deactivated after this application was created
    templateOptions.unshift({ value: templateId, label: currentTemplateName || "Current template" });
  }
  const resumeOptions = resumes.map((r) => ({
    value: r._id,
    label: `${r.label}${r.isDefault ? " (default)" : ""} · ${roleLabel(r.roleType)}`,
  }));

  const dirty = !isCreate && FIELDS.some((f) => (values[f] ?? "") !== (initial[f] ?? ""));

  /* ---- handlers ---- */
  const clearError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setField = (field) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    clearError(field);
  };

  const handleTemplateChange = (e) => {
    const value = e.target.value;
    setTemplateTouched(true);
    setValues((v) => ({ ...v, template: value }));
    clearError("template");
  };

  const handleResumeChange = (e) => {
    const value = e.target.value;
    setResumeTouched(true);
    setValues((v) => ({ ...v, resume: value }));
  };

  const validate = () => {
    const e = {};
    if (coreEditable) {
      if (!values.company.trim()) e.company = "Company is required";
      if (!values.role.trim()) e.role = "Role is required";
      if (!values.hrEmail.trim()) e.hrEmail = "HR email is required";
      else if (!isValidEmail(values.hrEmail)) e.hrEmail = "Enter a valid email address";
      if (!templateId) e.template = "Select a template";
    }
    const url = values.jobUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) e.jobUrl = "Must start with http:// or https://";
    return e;
  };

  const buildPayload = () => {
    const v = {
      company: values.company.trim(),
      role: values.role.trim(),
      hrName: values.hrName.trim(),
      hrEmail: values.hrEmail.trim(),
      jobUrl: values.jobUrl.trim(),
      jobDescription: values.jobDescription.trim(),
      notes: values.notes.trim(),
    };

    if (isCreate) {
      const payload = { company: v.company, role: v.role, hrEmail: v.hrEmail, template: templateId };
      ["hrName", "jobUrl", "jobDescription", "notes"].forEach((k) => {
        if (v[k]) payload[k] = v[k];
      });
      if (resumeId) payload.resume = resumeId;
      return payload;
    }

    // edit: always-editable fields (empty string = clear the field)
    const payload = {
      hrName: v.hrName,
      jobUrl: v.jobUrl,
      jobDescription: v.jobDescription,
      notes: v.notes,
    };
    if (coreEditable) {
      payload.company = v.company;
      payload.role = v.role;
      payload.hrEmail = v.hrEmail;
      payload.template = templateId;
      if (resumeId) payload.resume = resumeId;
    }
    return payload;
  };

  const submit = (nextIntent) => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    setIntent(nextIntent);
    onSubmit?.(buildPayload(), nextIntent);
  };

  const handleReset = () => {
    setValues(initial);
    setErrors({});
  };

  /* ---- hints ---- */
  const noTemplates = !templatesLoading && templates.length === 0;
  const templateHint = noTemplates ? (
    <>
      No active application templates.{" "}
      <Link href="/templates" className="font-medium text-indigo-600 underline">
        Create one
      </Link>
    </>
  ) : usingSuggestion ? (
    "Suggested based on job description"
  ) : undefined;

  const resumeHint =
    isCreate && !resumeTouched
      ? tplResumeId
        ? "From the template's default resume"
        : defaultResumeId
          ? "Using your default resume"
          : "None selected. The backend will pick one."
      : undefined;

  return (
    <form ref={formRef} noValidate onSubmit={(e) => e.preventDefault()} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Company"
          required={coreEditable}
          disabled={!coreEditable}
          value={values.company}
          onChange={setField("company")}
          error={errors.company}
          placeholder="Acme Inc"
        />
        <Input
          label="Role"
          required={coreEditable}
          disabled={!coreEditable}
          value={values.role}
          onChange={setField("role")}
          error={errors.role}
          placeholder="Full Stack Developer"
        />
        <Input
          label="HR name"
          value={values.hrName}
          onChange={setField("hrName")}
          placeholder="Priya Sharma"
        />
        <Input
          label="HR email"
          type="email"
          required={coreEditable}
          disabled={!coreEditable}
          value={values.hrEmail}
          onChange={setField("hrEmail")}
          error={errors.hrEmail}
          placeholder="hr@acme.com"
        />
        <Input
          label="Job URL"
          type="url"
          value={values.jobUrl}
          onChange={setField("jobUrl")}
          error={errors.jobUrl}
          placeholder="https://acme.com/careers/123"
          className="sm:col-span-2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Template"
          required={coreEditable}
          disabled={!coreEditable || templatesLoading}
          value={templateId}
          onChange={handleTemplateChange}
          options={templateOptions}
          placeholder={templatesLoading ? "Loading templates…" : "Select a template"}
          error={errors.template}
          hint={templateHint}
        />
        <Select
          label="Resume"
          disabled={!coreEditable || resumesLoading}
          value={resumeId}
          onChange={handleResumeChange}
          options={resumeOptions}
          placeholder={resumesLoading ? "Loading resumes…" : isCreate ? "Auto (template / default)" : "Select a resume"}
          hint={resumeHint}
        />
      </div>

      <Textarea
        label="Job description"
        rows={8}
        value={values.jobDescription}
        onChange={setField("jobDescription")}
        placeholder="Paste the job description here"
        hint={isCreate ? "Used to suggest the best template." : undefined}
      />

      <Textarea
        label="Notes"
        rows={3}
        value={values.notes}
        onChange={setField("notes")}
        placeholder="Referral, recruiter details, anything useful"
      />

      {isCreate ? (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            icon={Save}
            onClick={() => submit("draft")}
            disabled={submitting}
            loading={submitting && intent === "draft"}
          >
            Save as Draft
          </Button>
          <Button
            icon={Eye}
            onClick={() => submit("preview")}
            disabled={submitting}
            loading={submitting && intent === "preview"}
          >
            Save & Preview
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-600">{dirty ? "You have unsaved changes" : ""}</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="ghost" icon={RotateCcw} onClick={handleReset} disabled={!dirty || submitting}>
              Reset
            </Button>
            <Button icon={Save} onClick={() => submit("save")} disabled={!dirty} loading={submitting}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
