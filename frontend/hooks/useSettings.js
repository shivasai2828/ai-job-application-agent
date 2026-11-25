import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";

export function useSettings() {
  return useQuery({
    queryKey: [QUERY_KEYS.settings],
    queryFn: async () => (await api.get("/settings")).data.data,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => (await api.put("/settings", payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.settings] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.stats] }); // dailySendLimit shows on dashboard
      toast.success("Settings saved");
    },
  });
}
