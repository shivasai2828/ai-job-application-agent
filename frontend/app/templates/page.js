"use client";

import { useState } from "react";
import { FileText, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { useDeleteTemplate, useTemplates, useUpdateTemplate } from "@/hooks/useTemplates";
import { TEMPLATE_TYPES } from "@/lib/constants";
import { cn, getErrorMessage } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import RoleBadge from "@/components/ui/RoleBadge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import TemplateEditorModal, { templateToPayload } from "@/components/templates/TemplateEditorModal";

const CARD = "rounded-xl border border-gray-200 bg-white shadow-sm";

export default function TemplatesPage() {
  const { data: templates = [], isLoading, isError, error, refetch } = useTemplates();
  const updateMut = useUpdateTemplate();
  const deleteMut = useDeleteTemplate();

  const [editor, setEditor] = useState({ open: false, template: null, type: "application" });
  const [toDelete, setToDelete] = useState(null);

  const openCreate = (type = "application") => setEditor({ open: true, template: null, type });
  const openEdit = (template) => setEditor({ open: true, template, type: template.type });
  const closeEditor = () => setEditor((e) => ({ ...e, open: false }));

  const groups = TEMPLATE_TYPES.map((t) => ({
    ...t,
    items: templates.filter((tpl) => tpl.type === t.value),
  }));

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Email templates for applications and follow-ups"
        actions={
          <Button icon={Plus} onClick={() => openCreate("application")}>
            New Template
          </Button>
        }
      />

      {isError ? (
        <ErrorState title="Couldn't load templates" message={getErrorMessage(error)} onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-6" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates yet"
          description="Create an application template first, then follow-up 1 and follow-up 2 templates."
          action={
            <Button icon={Plus} onClick={() => openCreate("application")}>
              New Template
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.value} className={CARD}>
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                <h2 className="text-sm font-semibold text-gray-900">
                  {group.label}
                  <span className="ml-2 text-xs font-normal text-gray-500">{group.items.length}</span>
                </h2>
                <Button variant="ghost" size="sm" icon={Plus} onClick={() => openCreate(group.value)}>
                  Add
                </Button>
              </div>

              {group.items.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-500">No {group.label.toLowerCase()} templates yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {group.items.map((t) => {
                    const toggling = updateMut.isPending && updateMut.variables?.id === t._id;
                    return (
                      <li
                        key={t._id}
                        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className={cn("min-w-0", !t.isActive && "opacity-60")}>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="break-words font-medium text-gray-900">{t.name}</p>
                            <RoleBadge roleType={t.roleType} />
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <Paperclip className="h-3 w-3" />
                            {t.defaultResume?.label || "No default resume"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Toggle
                            label={t.isActive ? "Active" : "Inactive"}
                            checked={Boolean(t.isActive)}
                            disabled={toggling}
                            onChange={(isActive) =>
                              updateMut.mutate({ id: t._id, ...templateToPayload(t), isActive })
                            }
                          />
                          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openEdit(t)}>
                            Edit
                          </Button>
                          <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setToDelete(t)}>
                            Delete
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <TemplateEditorModal
        open={editor.open}
        template={editor.template}
        defaultType={editor.type}
        onClose={closeEditor}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => deleteMut.mutate(toDelete._id, { onSettled: () => setToDelete(null) })}
        title="Delete template?"
        message={`Delete "${toDelete?.name}"? This can't be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
