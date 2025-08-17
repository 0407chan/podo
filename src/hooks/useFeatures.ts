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

export function useDeleteFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; project_id: string }) => {
      // 1) Unlink todos from this feature (set feature_id to null)
      const { error: unlinkErr } = await supabase
        .from("todos")
        .update({ feature_id: null })
        .eq("project_id", payload.project_id)
        .eq("feature_id", payload.id);
      if (unlinkErr) throw unlinkErr;

      // 2) Delete feature itself
      const { error: delErr } = await supabase
        .from("features")
        .delete()
        .eq("id", payload.id)
        .eq("project_id", payload.project_id);
      if (delErr) throw delErr;
      return true as const;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["features", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["todos_weekly", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["feature_progress", vars.project_id] });
      qc.invalidateQueries({
        queryKey: ["feature_linked_todos", vars.project_id],
      });
    },
  });
}
