"use client";

import { useRef, useState } from "react";
import { Info, Save } from "lucide-react";
import { useResumes } from "@/hooks/useResumes";
import { useCreateTemplate, useTemplatePreview, useUpdateTemplate } from "@/hooks/useTemplates";
import useDebounce from "@/hooks/useDebounce";
import { ROLE_TYPES, TEMPLATE_TYPES } from "@/lib/constants";
import { getErrorMessage, idOf, insertAtCursor } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Toggle from "@/components/ui/Toggle";
import Spinner from "@/components/ui/Spinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import VariableChips from "./VariableChips";

// The backend ignores the subject of follow-up templates, but we still send
// a placeholder so it never fails validation for an empty subject.
export const FOLLOW_UP_SUBJECT = "Follow-up";

// Builds a full PUT payload from a template object (used by the active toggle)
export function templateToPayload(t) {
  return {
    name: t.name,
    type: t.type,
    roleType: t.roleType,
    subject: t.subject || (t.type === "application" ? "" : FOLLOW_UP_SUBJECT),
    body: t.body,
    defaultResume: idOf(t.defaultResume) || null,
    isActive: t.isActive,
  };
}

// Inner component only exists while open, so its state resets on every open.
export default function TemplateEditorModal({ open, template, defaultType = "application", onClose }) {
  if (!open) return null;
  return <TemplateEditorInner template={template} defaultType={defaultType} onClose={onClose} />;
}

function TemplateEditorInner({ template, defaultType, onClose }) {
  const isEdit = Boolean(template);

  const initial = isEdit
    ? {
        name: template.name || "",
        type: template.type,
        roleType: template.roleType,
        subject: template.subject || "",
        body: template.body || "",
        defaultResume: idOf(template.defaultResume),
        isActive: template.isActive !== false,
      }
    : {
        name: "",
        type: defaultType,
        roleType: "fullstack",
        subject: "",
        body: "",
        defaultResume: "",
        isActive: true,
      };

  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [lastField, setLastField] = useState("body");
  const [discardOpen, setDiscardOpen] = useState(false);

  const subjectRef = useRef(null);
  const bodyRef = useRef(null);

  const { data: resumes = [] } = useResumes();
  const createMut = useCreateTemplate();
  const updateMut = useUpdateTemplate();
  const saving = createMut.isPending || updateMut.isPending;

  const showSubject = values.type === "application";
  const insertTarget = showSubject && lastField === "subject" ? "subject" : "body";
  const dirty = Object.keys(initial).some((k) => values[k] !== initial[k]);

  /* ---------------- live preview (debounced) ---------------- */
  const debSubject = useDebounce(values.subject, 500);
  const debBody = useDebounce(values.body, 500);
  const previewSubject = showSubject ? debSubject : FOLLOW_UP_SUBJECT;
  const previewReady = Boolean(debBody.trim()) && Boolean(previewSubject.trim());
  const preview = useTemplatePreview({ subject: previewSubject, body: debBody }, previewReady);

  /* ---------------- handlers ---------------- */
  const setField = (field) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const insertVariable = (variable) => {
    const field = insertTarget;
    const el = field === "subject" ? subjectRef.current : bodyRef.current;
    const { value, cursor } = insertAtCursor(el, variable, values[field]);
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(cursor, cursor);
    });
  };

  const requestClose = () => (dirty ? setDiscardOpen(true) : onClose());

  const submit = () => {
    const e = {};
    if (!values.name.trim()) e.name = "Name is required";
    if (showSubject && !values.subject.trim()) e.subject = "Subject is required";
    if (!values.body.trim()) e.body = "Body is required";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload = {
      name: values.name.trim(),
      type: values.type,
      roleType: values.roleType,
      subject: showSubject ? values.subject.trim() : values.subject.trim() || FOLLOW_UP_SUBJECT,
      body: values.body,
      defaultResume: values.defaultResume || null,
      isActive: values.isActive,
    };

    if (isEdit) updateMut.mutate({ id: template._id, ...payload }, { onSuccess: onClose });
    else createMut.mutate(payload, { onSuccess: onClose });
  };

  const resumeOptions = resumes.map((r) => ({
    value: r._id,
    label: `${r.label}${r.isDefault ? " (default)" : ""}`,
  }));

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        title={isEdit ? "Edit template" : "New template"}
        description="Variables like {{company}} are filled in when the email is generated"
        size="xl"
        dismissible={!saving}
        footer={
          <>
            <Button variant="secondary" onClick={requestClose} disabled={saving}>
              Cancel
            </Button>
            <Button icon={Save} onClick={submit} loading={saving}>
              {isEdit ? "Save changes" : "Create template"}
            </Button>
          </>
        }
      >
        <form noValidate onSubmit={(e) => e.preventDefault()} className="grid gap-6 lg:grid-cols-2">
          {/* ---------- editor ---------- */}
          <div className="space-y-4">
            <Input
              label="Name"
              required
              value={values.name}
              onChange={setField("name")}
              error={errors.name}
              placeholder="Full-stack application"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Type" value={values.type} onChange={setField("type")} options={TEMPLATE_TYPES} />
              <Select label="Role type" value={values.roleType} onChange={setField("roleType")} options={ROLE_TYPES} />
            </div>

            {showSubject ? (
              <Input
                ref={subjectRef}
                label="Subject"
                required
                value={values.subject}
                onChange={setField("subject")}
                onFocus={() => setLastField("subject")}
                error={errors.subject}
                placeholder="Application for {{role}} at {{company}}"
              />
            ) : (
              <div className="flex gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Follow-ups reply in the same thread as &ldquo;Re: &lt;original subject&gt;&rdquo;, so there&apos;s no subject to set.</p>
              </div>
            )}

            <VariableChips onInsert={insertVariable} target={insertTarget} />

            <Textarea
              ref={bodyRef}
              label="Body"
              required
              mono
              rows={14}
              value={values.body}
              onChange={setField("body")}
              onFocus={() => setLastField("body")}
              error={errors.body}
              placeholder={"Hi {{hr_name}},\n\nI'm interested in the {{role}} role at {{company}}…\n\nThanks,\n{{your_name}}"}
            />

            <Select
              label="Default resume"
              value={values.defaultResume}
              onChange={setField("defaultResume")}
              options={resumeOptions}
              placeholder="None"
              hint="Pre-selected when you create an application from this template."
            />

            <div>
              <Toggle
                label="Active"
                checked={values.isActive}
                onChange={(isActive) => setValues((v) => ({ ...v, isActive }))}
              />
              <p className="mt-1 text-xs text-gray-500">
                Only active application templates show up when creating an application.
              </p>
            </div>
          </div>

          {/* ---------- live preview ---------- */}
          <div className="lg:sticky lg:top-0 lg:self-start">
            <div className="rounded-xl border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
                <h3 className="text-sm font-semibold text-gray-900">Live preview</h3>
                {preview.isFetching && <Spinner size="sm" />}
              </div>

              <div className="p-4 text-sm">
                {!previewReady ? (
                  <p className="text-gray-500">Start writing the body and the preview will show up here.</p>
                ) : preview.isError ? (
                  <p className="text-red-600">{getErrorMessage(preview.error, "Couldn't generate preview")}</p>
                ) : preview.data ? (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Subject</p>
                    <p className="mb-4 mt-1 break-words font-medium text-gray-900">
                      {showSubject ? preview.data.subject : "Re: <original subject>"}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Body</p>
                    <pre className="mt-1 whitespace-pre-wrap break-words font-sans text-gray-800">
                      {preview.data.body}
                    </pre>
                    <p className="mt-4 text-xs text-gray-500">Uses sample values for HR name, company and role.</p>
                  </>
                ) : (
                  <Spinner centered label="Generating preview…" />
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={onClose}
        title="Discard changes?"
        message="You have unsaved changes in this template. They'll be lost."
        confirmLabel="Discard"
        variant="danger"
      />
    </>
  );
}
