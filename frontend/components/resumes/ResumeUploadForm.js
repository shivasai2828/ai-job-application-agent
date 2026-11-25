"use client";

import { useId, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useUploadResume } from "@/hooks/useResumes";
import { ACCEPTED_RESUME_TYPES, MAX_RESUME_SIZE, ROLE_TYPES } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";
import Field, { describedBy, fieldClass } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const stripExt = (name = "") => name.replace(/\.[^.]+$/, "");

function validateFile(file) {
  if (!/\.(pdf|docx?)$/i.test(file.name)) return "Only PDF, DOC or DOCX files are allowed";
  if (file.size > MAX_RESUME_SIZE) return `File is too large (${formatBytes(file.size)}). Max is 5 MB`;
  return "";
}

export default function ResumeUploadForm() {
  const fileId = useId();
  const fileRef = useRef(null);
  const upload = useUploadResume();

  const [file, setFile] = useState(null);
  const [label, setLabel] = useState("");
  const [roleType, setRoleType] = useState("fullstack");
  const [isDefault, setIsDefault] = useState(false);
  const [fileError, setFileError] = useState("");

  const reset = () => {
    setFile(null);
    setLabel("");
    setRoleType("fullstack");
    setIsDefault(false);
    setFileError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (e) => {
    const picked = e.target.files?.[0] || null;
    setFile(picked);
    setFileError(picked ? validateFile(picked) : "");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!file) return setFileError("Choose a resume file");
    const err = validateFile(file);
    if (err) return setFileError(err);

    upload.mutate(
      { file, label: label.trim() || stripExt(file.name), roleType, isDefault },
      { onSuccess: reset }
    );
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={fileId}
          label="Resume file"
          required
          error={fileError}
          hint="PDF, DOC or DOCX, max 5 MB"
          className="sm:col-span-2"
        >
          <input
            ref={fileRef}
            id={fileId}
            type="file"
            accept={ACCEPTED_RESUME_TYPES}
            onChange={handleFile}
            aria-invalid={fileError ? true : undefined}
            aria-describedby={describedBy(fileId, fileError, "hint")}
            className={cn(
              fieldClass(fileError),
              "cursor-pointer py-1.5 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            )}
          />
        </Field>

        <Input
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={file ? stripExt(file.name) : "e.g. Full-stack resume"}
          hint="Defaults to the file name"
        />
        <Select label="Role type" value={roleType} onChange={(e) => setRoleType(e.target.value)} options={ROLE_TYPES} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded accent-indigo-600"
          />
          Set as default resume
        </label>

        <Button type="submit" icon={Upload} loading={upload.isPending}>
          Upload resume
        </Button>
      </div>
    </form>
  );
}
