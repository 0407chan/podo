import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export type Feature = {
  id: string;
  project_id: string;
  title: string;
  status: "todo" | "done";
  created_at: string;
  updated_at: string;
};

export function useFeatures(projectId: string | undefined) {
  return useQuery<Feature[]>({
    queryKey: ["features", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("features")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Feature[];
    },
    enabled: !!projectId,
    staleTime: 5000,
  });
}

export function useCreateFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { project_id: string; title: string }) => {
      const { data, error } = await supabase
        .from("features")
        .insert({ project_id: payload.project_id, title: payload.title })
        .select("*")
        .single();
      if (error) throw error;
      return data as Feature;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["features", vars.project_id] });
    },
  });
}

export function useToggleFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; project_id: string }) => {
      const { data: prev } = await supabase
        .from("features")
        .select("status")
        .eq("id", payload.id)
        .single();
      const next = prev?.status === "done" ? "todo" : "done";
      const { error } = await supabase
        .from("features")
        .update({ status: next })
        .eq("id", payload.id);
      if (error) throw error;
      return { id: payload.id, next } as const;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["features", vars.project_id] });
    },
  });
}
