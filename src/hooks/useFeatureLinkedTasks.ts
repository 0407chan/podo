import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export type FeatureLinkedTask = {
  id: string;
  feature_todo_id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
};

export function useFeatureLinkedTasks(projectId: string | undefined) {
  return useQuery<Record<string, FeatureLinkedTask[]>>({
    queryKey: ["feature_linked_tasks", projectId],
    queryFn: async () => {
      if (!projectId) return {};
      const { data, error } = await supabase
        .from("daily_tasks")
        .select("id, feature_todo_id, title, status")
        .eq("project_id", projectId)
        .not("feature_todo_id", "is", null);
      if (error) throw error;
      const map: Record<string, FeatureLinkedTask[]> = {};
      for (const row of (data ?? []) as any[]) {
        const fid = row.feature_todo_id as string;
        (map[fid] ??= []).push({
          id: row.id,
          feature_todo_id: fid,
          title: row.title,
          status: row.status,
        });
      }
      return map;
    },
    enabled: !!projectId,
    staleTime: 2000,
  });
}
