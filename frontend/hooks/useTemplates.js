import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { cleanParams } from "@/lib/utils";

// filters: { type, roleType, isActive }
export function useTemplates(filters = {}) {
  const params = cleanParams(filters);

  return useQuery({
    queryKey: [QUERY_KEYS.templates, params],
    queryFn: async () => (await api.get("/templates", { params })).data.data || [],
  });
}

export function useTemplate(id) {
  return useQuery({
    queryKey: [QUERY_KEYS.template, id],
    queryFn: async () => (await api.get(`/templates/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

// Live preview. Pass DEBOUNCED values in, so it doesn't fire on every keystroke.
export function useTemplatePreview({ subject, body, hrName, company, role }, enabled = true) {
  return useQuery({
    queryKey: ["template-preview", subject, body, hrName, company, role],
    queryFn: async () =>
      (await api.post("/templates/preview", { subject, body, hrName, company, role })).data.data,
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

function invalidateTemplates(qc, id) {
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.templates] });
  if (id) qc.invalidateQueries({ queryKey: [QUERY_KEYS.template, id] });
}

export function useCreateTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => (await api.post("/templates", payload)).data.data,
    onSuccess: () => {
      invalidateTemplates(qc);
      toast.success("Template created");
    },
  });
}

// mutate({ id, ...fields })
export function useUpdateTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }) => (await api.put(`/templates/${id}`, fields)).data.data,
    onSuccess: (_data, { id }) => {
      invalidateTemplates(qc, id);
      toast.success("Template saved");
    },
  });
}

// mutate(id)
export function useDeleteTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => (await api.delete(`/templates/${id}`)).data,
    onSuccess: () => {
      invalidateTemplates(qc);
      toast.success("Template deleted");
    },
  });
}
