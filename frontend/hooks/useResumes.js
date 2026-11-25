import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { downloadBlob } from "@/lib/utils";

export function useResumes() {
  return useQuery({
    queryKey: [QUERY_KEYS.resumes],
    queryFn: async () => (await api.get("/resumes")).data.data || [],
  });
}

// Resume label / default shows up in templates and applications too
function invalidateResumeRelated(qc) {
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.resumes] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.templates] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.applications] });
  qc.invalidateQueries({ queryKey: [QUERY_KEYS.application] });
}

// mutate({ file, label, roleType, isDefault })
export function useUploadResume() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, label, roleType, isDefault }) => {
      const formData = new FormData();
      formData.append("resume", file); // field name MUST be "resume"
      if (label) formData.append("label", label);
      if (roleType) formData.append("roleType", roleType);
      formData.append("isDefault", isDefault ? "true" : "false");
      return (await api.post("/resumes", formData)).data.data;
    },
    onSuccess: () => {
      invalidateResumeRelated(qc);
      toast.success("Resume uploaded");
    },
  });
}

// mutate({ id, label?, roleType?, isDefault? })
export function useUpdateResume() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fields }) => (await api.put(`/resumes/${id}`, fields)).data.data,
    onSuccess: () => {
      invalidateResumeRelated(qc);
      toast.success("Resume updated");
    },
  });
}

// mutate(id). Backend returns 409 if it's used by an application (interceptor toasts it)
export function useDeleteResume() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => (await api.delete(`/resumes/${id}`)).data,
    onSuccess: () => {
      invalidateResumeRelated(qc);
      toast.success("Resume deleted");
    },
  });
}

// mutate({ id, filename })
export function useDownloadResume() {
  return useMutation({
    mutationFn: async ({ id, filename }) => {
      const res = await api.get(`/resumes/${id}/file`, { responseType: "blob" });
      downloadBlob(res.data, filename || "resume");
    },
  });
}
