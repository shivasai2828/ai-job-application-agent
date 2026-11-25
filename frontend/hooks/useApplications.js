import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { cleanParams } from "@/lib/utils";

// Refresh list + stats (+ one application and its preview if an id is given)
function invalidateApplications(qc, id) {
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.applications] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
  if (id) {
    qc.invalidateQueries({ queryKey: [QUERY_KEYS.application, id] });
    qc.invalidateQueries({ queryKey: [QUERY_KEYS.applicationPreview, id] });
  }
}

/* ----------------------------- queries ----------------------------- */

// params: { status: ["sent", ...] | "sent,draft", search, from, to, page, limit, sort }
// returns: { items, pagination }
export function useApplications(params = {}) {
  const query = cleanParams(params);

  return useQuery({
    queryKey: [QUERY_KEYS.applications, "list", query],
    queryFn: async () => {
      const res = await api.get("/applications", { params: query });
      return { items: res.data.data || [], pagination: res.data.pagination || null };
    },
    placeholderData: keepPreviousData, // keeps old rows visible while the next page loads
  });
}

export function useApplicationStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.stats],
    queryFn: async () => (await api.get("/applications/stats")).data.data,
  });
}

export function useApplication(id) {
  return useQuery({
    queryKey: [QUERY_KEYS.application, id],
    queryFn: async () => (await api.get(`/applications/${id}`)).data.data,
    enabled: Boolean(id),
    // poll while the backend is mid-send
    refetchInterval: (query) => (query.state.data?.status === "sending" ? 3000 : false),
  });
}

// Pass enabled=modalIsOpen so it fetches fresh each time the modal opens
export function useApplicationPreview(id, enabled = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.applicationPreview, id],
    queryFn: async () => (await api.get(`/applications/${id}/preview`)).data.data,
    enabled: Boolean(id) && enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

/* ---------------------------- mutations ---------------------------- */

// mutateAsync(payload) -> { application, duplicates }
export function useCreateApplication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/applications", payload);
      return { application: res.data.data, duplicates: res.data.duplicates || [] };
    },
    onSuccess: () => {
      invalidateApplications(qc);
      toast.success("Application saved");
    },
  });
}

// mutate({ id, ...fields })
export function useUpdateApplication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }) => (await api.patch(`/applications/${id}`, fields)).data.data,
    onSuccess: (_data, { id }) => {
      invalidateApplications(qc, id);
      toast.success("Changes saved");
    },
  });
}

// mutate(id). Navigate away in the component's onSuccess.
// (We don't refetch the deleted application here, that would 404.)
export function useDeleteApplication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => (await api.delete(`/applications/${id}`)).data,
    onSuccess: () => {
      invalidateApplications(qc);
      toast.success("Application deleted");
    },
  });
}

// mutate({ id, subject?, body? })  (subject/body only if the preview was edited)
export function useSendApplication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, subject, body }) => {
      const payload = subject !== undefined || body !== undefined ? { subject, body } : undefined;
      return (await api.post(`/applications/${id}/send`, payload)).data.data;
    },
    onSuccess: () => toast.success("Email sent"),
    // onSettled so a failed send (status -> failed, lastError) also refreshes the UI
    onSettled: (_data, _error, { id }) => invalidateApplications(qc, id),
  });
}

// mutate({ id, status })  status: replied | interview | rejected | closed
export function useUpdateApplicationStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) =>
      (await api.patch(`/applications/${id}/status`, { status })).data.data,
    onSuccess: (_data, { id }) => {
      invalidateApplications(qc, id);
      toast.success("Status updated");
    },
  });
}

// mutate({ id, enabled })
export function useToggleFollowUps() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }) =>
      (await api.patch(`/applications/${id}/follow-ups`, { enabled })).data.data,
    onSuccess: (_data, { id, enabled }) => {
      invalidateApplications(qc, id);
      toast.success(enabled ? "Auto follow-ups enabled" : "Auto follow-ups paused");
    },
  });
}
