import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export type FeatureTodo = {
  id: string;
  project_id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  created_at: string;
  updated_at: string;
};

export function useFeatureTodos(projectId: string | undefined) {
  return useQuery<FeatureTodo[]>({
    queryKey: ["feature_todos", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("feature_todos")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FeatureTodo[];
    },
    enabled: !!projectId,
    staleTime: 5000,
  });
}

export function useCreateFeatureTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { project_id: string; title: string }) => {
      const { data, error } = await supabase
        .from("feature_todos")
        .insert({ project_id: payload.project_id, title: payload.title })
        .select("*")
        .single();
      if (error) throw error;
      return data as FeatureTodo;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["feature_todos", vars.project_id] });
    },
  });
}

export function useToggleFeatureTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; project_id: string }) => {
      const { data: prev } = await supabase
        .from("feature_todos")
        .select("status")
        .eq("id", payload.id)
        .single();
      const next = prev?.status === "done" ? "todo" : "done";
      const { error } = await supabase
        .from("feature_todos")
        .update({ status: next })
        .eq("id", payload.id);
      if (error) throw error;
      return { id: payload.id, next };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["feature_todos", vars.project_id] });
    },
  });
}
