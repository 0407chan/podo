import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export type DailyTodoLink = {
  id: string;
  daily_id: string;
  feature_todo_id: string;
  note: string | null;
  created_at: string;
};

export function useDailyTodoLinks(dailyId: string | undefined) {
  return useQuery<DailyTodoLink[]>({
    queryKey: ["daily_todos", dailyId],
    queryFn: async () => {
      if (!dailyId) return [];
      const { data, error } = await supabase
        .from("daily_todos")
        .select("*")
        .eq("daily_id", dailyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DailyTodoLink[];
    },
    enabled: !!dailyId,
    staleTime: 5000,
  });
}

export function useLinkDailyTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      daily_id: string;
      feature_todo_id: string;
    }) => {
      const { data, error } = await supabase
        .from("daily_todos")
        .upsert(
          {
            daily_id: payload.daily_id,
            feature_todo_id: payload.feature_todo_id,
          },
          { onConflict: "daily_id,feature_todo_id" }
        )
        .select("*")
        .single();
      if (error) throw error;
      return data as DailyTodoLink;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["daily_todos", vars.daily_id] });
    },
  });
}

export function useUnlinkDailyTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      daily_id: string;
      feature_todo_id: string;
    }) => {
      const { error } = await supabase
        .from("daily_todos")
        .delete()
        .match({
          daily_id: payload.daily_id,
          feature_todo_id: payload.feature_todo_id,
        });
      if (error) throw error;
      return true as const;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["daily_todos", vars.daily_id] });
    },
  });
}
