"use client";

import { useState } from "react";
import { Download, FileText, Pencil, Star, Trash2 } from "lucide-react";
import {
  useDeleteResume,
  useDownloadResume,
  useUpdateResume,
} from "@/hooks/useResumes";
import { ROLE_TYPES } from "@/lib/constants";
import { formatBytes, formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import RoleBadge from "@/components/ui/RoleBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function ResumeList({ resumes }) {
  const updateMut = useUpdateResume();
  const deleteMut = useDeleteResume();
  const downloadMut = useDownloadResume();

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  return (
    <>
      <ul className="divide-y divide-gray-100">
        {resumes.map((r) => {
          const downloading = downloadMut.isPending && downloadMut.variables?.id === r._id;
          const settingDefault = updateMut.isPending && updateMut.variables?.id === r._id;

          return (
            <li
              key={r._id}
              className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words font-medium text-gray-900">{r.label}</p>
                    {r.isDefault && (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        Default
                      </span>
                    )}
                    <RoleBadge roleType={r.roleType} />
                  </div>
                  <p className="mt-0.5 break-all text-xs text-gray-500">
                    {r.originalName} · {formatBytes(r.size)} · uploaded {formatDate(r.createdAt, "dd MMM yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  loading={downloading}
                  onClick={() => downloadMut.mutate({ id: r._id, filename: r.originalName })}
                >
                  Download
                </Button>
                {!r.isDefault && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Star}
                    loading={settingDefault}
                    onClick={() => updateMut.mutate({ id: r._id, isDefault: true })}
                  >
                    Set Default
                  </Button>
                )}
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(r)}>
                  Edit
                </Button>
                <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setDeleting(r)}>
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {editing && <ResumeEditModal key={editing._id} resume={editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMut.mutate(deleting._id, { onSettled: () => setDeleting(null) })}
        title="Delete resume?"
        message={`Delete "${deleting?.label}"? If an application uses it, the server will refuse and tell you why.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMut.isPending}
      />
    </>
  );
}

function ResumeEditModal({ resume, onClose }) {
  const update = useUpdateResume();
  const [label, setLabel] = useState(resume.label || "");
  const [roleType, setRoleType] = useState(resume.roleType || "general");
  const [error, setError] = useState("");

  const save = () => {
    if (!label.trim()) return setError("Label is required");
    update.mutate({ id: resume._id, label: label.trim(), roleType }, { onSuccess: onClose });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit resume"
      description={resume.originalName}
      dismissible={!update.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={save} loading={update.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-4"
      >
        <Input
          label="Label"
          required
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setError("");
          }}
          error={error}
        />
        <Select label="Role type" value={roleType} onChange={(e) => setRoleType(e.target.value)} options={ROLE_TYPES} />
      </form>
    </Modal>
  );
}
