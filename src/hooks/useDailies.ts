import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export type Daily = {
  id: string;
  project_id: string;
  date: string; // YYYY-MM-DD
  content: string;
  content_json: any | null;
  created_at: string;
  updated_at: string;
};

export function useDailies(projectId: string | undefined) {
  return useQuery<Daily[]>({
    queryKey: ["dailies", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("dailies")
        .select("*")
        .eq("project_id", projectId)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Daily[];
    },
    enabled: !!projectId,
    staleTime: 5000,
  });
}

export function useUpsertDaily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      project_id: string;
      date: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from("dailies")
        .upsert(
          {
            project_id: payload.project_id,
            date: payload.date,
            content: payload.content,
          },
          { onConflict: "project_id,date" }
        )
        .select("*")
        .single();
      if (error) throw error;
      return data as Daily;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["dailies", vars.project_id] });
    },
  });
}
