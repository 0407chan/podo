import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export type FeatureProgress = {
  feature_id: string;
  total: number;
  done: number;
};

export function useFeatureProgress(projectId: string | undefined) {
  return useQuery<FeatureProgress[]>({
    queryKey: ["feature_progress", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("daily_tasks")
        .select("feature_todo_id, status")
        .eq("project_id", projectId);
      if (error) throw error;
      const map = new Map<string, { total: number; done: number }>();
      for (const row of (data ?? []) as any[]) {
        const fid = row.feature_todo_id as string | null;
        if (!fid) continue;
        const entry = map.get(fid) ?? { total: 0, done: 0 };
        entry.total += 1;
        if (row.status === "done") entry.done += 1;
        map.set(fid, entry);
      }
      return Array.from(map.entries()).map(([feature_id, v]) => ({
        feature_id,
        total: v.total,
        done: v.done,
      }));
    },
    enabled: !!projectId,
    staleTime: 3000,
  });
}
