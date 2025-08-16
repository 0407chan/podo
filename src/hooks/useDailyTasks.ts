import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export type DailyTask = {
  id: string;
  project_id: string;
  daily_id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  feature_todo_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export function useDailyTasks(dailyId: string | undefined) {
  return useQuery<DailyTask[]>({
    queryKey: ["daily_tasks", dailyId],
    queryFn: async () => {
      if (!dailyId) return [];
      const { data, error } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("daily_id", dailyId)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DailyTask[];
    },
    enabled: !!dailyId,
    staleTime: 3000,
  });
}

export function useCreateDailyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      project_id: string;
      daily_id: string;
      title: string;
    }) => {
      const { data, error } = await supabase
        .from("daily_tasks")
        .insert({
          project_id: payload.project_id,
          daily_id: payload.daily_id,
          title: payload.title,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as DailyTask;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["daily_tasks", vars.daily_id] });
    },
  });
}

export function useToggleDailyTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      daily_id: string;
      project_id: string;
    }) => {
      const { data: prev, error: readErr } = await supabase
        .from("daily_tasks")
        .select("status")
        .eq("id", payload.id)
        .single();
      if (readErr) throw readErr;
      const next = prev?.status === "done" ? "todo" : "done";
      const { error } = await supabase
        .from("daily_tasks")
        .update({ status: next })
        .eq("id", payload.id);
      if (error) throw error;
      return { id: payload.id, next };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["daily_tasks", vars.daily_id] });
      qc.invalidateQueries({ queryKey: ["feature_progress", vars.project_id] });
      qc.invalidateQueries({
        queryKey: ["feature_linked_tasks", vars.project_id],
      });
    },
  });
}

export function useAssignDailyTaskFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      daily_id: string;
      project_id: string;
      feature_todo_id: string | null;
    }) => {
      const { error } = await supabase
        .from("daily_tasks")
        .update({ feature_todo_id: payload.feature_todo_id })
        .eq("id", payload.id);
      if (error) throw error;
      return true as const;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["daily_tasks", vars.daily_id] });
      qc.invalidateQueries({ queryKey: ["feature_progress", vars.project_id] });
      qc.invalidateQueries({
        queryKey: ["feature_linked_tasks", vars.project_id],
      });
    },
  });
}
