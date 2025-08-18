import type { Priority } from "@/types/literal";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export type Todo = {
  id: string;
  project_id: string;
  date: string; // YYYY-MM-DD
  title: string;
  status: "todo" | "done";
  feature_id: string | null;
  priority?: Priority;
  order_index: number;
  created_at: string;
  updated_at: string;
  series_id: string;
  rolled_from_id: string | null;
};

export function useTodoDates(projectId: string | undefined) {
  return useQuery<string[]>({
    queryKey: ["todo_dates", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("todos")
        .select("date")
        .eq("project_id", projectId)
        .order("date", { ascending: false });
      if (error) throw error;
      const dates = Array.from(
        new Set((data ?? []).map((r: any) => String(r.date)))
      );
      return dates;
    },
    enabled: !!projectId,
    staleTime: 5000,
  });
}

export function useTodos(
  projectId: string | undefined,
  date: string | undefined
) {
  return useQuery<Todo[]>({
    queryKey: ["todos", projectId, date],
    queryFn: async () => {
      if (!projectId || !date) return [];
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("project_id", projectId)
        .eq("date", date)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Todo[];
    },
    enabled: !!projectId && !!date,
    staleTime: 3000,
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      project_id: string;
      date: string;
      title: string;
      feature_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("todos")
        .insert({
          project_id: payload.project_id,
          date: payload.date,
          title: payload.title,
          feature_id: payload.feature_id ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Todo;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["todos", vars.project_id, vars.date] });
      qc.invalidateQueries({ queryKey: ["todo_dates", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["todos_weekly", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["feature_progress", vars.project_id] });
      qc.invalidateQueries({
        queryKey: ["feature_linked_todos", vars.project_id],
      });
    },
  });
}

export function useToggleTodoStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      project_id: string;
      date: string;
    }) => {
      const { data: prev, error: readErr } = await supabase
        .from("todos")
        .select("status, series_id")
        .eq("id", payload.id)
        .single();
      if (readErr) throw readErr;
      const next = prev?.status === "done" ? "todo" : "done";
      const seriesId = (prev as any)?.series_id as string | undefined;
      if (!seriesId) throw new Error("series_id not found");
      const { error } = await supabase
        .from("todos")
        .update({ status: next })
        .eq("project_id", payload.project_id)
        .eq("series_id", seriesId);
      if (error) throw error;
      return { id: payload.id, next } as const;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["todos", vars.project_id, vars.date] });
      qc.invalidateQueries({ queryKey: ["todos_weekly", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["feature_progress", vars.project_id] });
      qc.invalidateQueries({
        queryKey: ["feature_linked_todos", vars.project_id],
      });
    },
  });
}

export function useRolloverTodosToToday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { project_id: string }) => {
      const projectId = payload.project_id;
      // today string
      const today = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      })();

      // 1) fetch today's existing series to avoid duplicates
      const { data: todayRows, error: todayErr } = await supabase
        .from("todos")
        .select("series_id")
        .eq("project_id", projectId)
        .eq("date", today);
      if (todayErr) throw todayErr;
      const todaySeries = new Set<string>(
        (todayRows ?? []).map((r: any) => r.series_id as string)
      );

      // 2) fetch past, not-done rows
      const { data: pastRows, error: pastErr } = await supabase
        .from("todos")
        .select("id, series_id, title, feature_id, priority, date, status")
        .eq("project_id", projectId)
        .lt("date", today)
        .eq("status", "todo")
        .order("date", { ascending: false });
      if (pastErr) throw pastErr;

      // 3) pick latest row per series
      const latestBySeries = new Map<string, any>();
      for (const row of (pastRows ?? []) as any[]) {
        const sid = row.series_id as string;
        if (!latestBySeries.has(sid)) latestBySeries.set(sid, row);
      }

      // 4) build inserts excluding series already present today
      const inserts = Array.from(latestBySeries.values())
        .filter((r: any) => !todaySeries.has(r.series_id as string))
        .map((r: any) => ({
          project_id: projectId,
          date: today,
          title: r.title as string,
          feature_id: (r.feature_id as string | null) ?? null,
          priority: r.priority ?? null,
          series_id: r.series_id as string,
          rolled_from_id: r.id as string,
          status: "todo",
        }));

      if (inserts.length === 0) return { inserted: 0 } as const;

      const { error: insErr } = await supabase.from("todos").insert(inserts);
      if (insErr) throw insErr;
      return { inserted: inserts.length } as const;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["todos", vars.project_id] as any });
      qc.invalidateQueries({ queryKey: ["todo_dates", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["todos_weekly", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["feature_progress", vars.project_id] });
      qc.invalidateQueries({
        queryKey: ["feature_linked_todos", vars.project_id],
      });
    },
  });
}

export function useRolloverSeriesToToday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { project_id: string; series_id: string }) => {
      const { project_id: projectId, series_id } = payload;
      const today = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      })();

      // skip if already exists today
      const { data: existing, error: existErr } = await supabase
        .from("todos")
        .select("id")
        .eq("project_id", projectId)
        .eq("series_id", series_id)
        .eq("date", today)
        .maybeSingle();
      if (existErr) throw existErr;
      if (existing) return { inserted: 0 } as const;

      // latest row in series
      const { data: latest, error: latestErr } = await supabase
        .from("todos")
        .select("id, title, feature_id, priority")
        .eq("project_id", projectId)
        .eq("series_id", series_id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestErr) throw latestErr;
      if (!latest) throw new Error("series not found");

      const { error: insErr } = await supabase.from("todos").insert({
        project_id: projectId,
        date: today,
        title: (latest as any).title as string,
        feature_id: ((latest as any).feature_id as string | null) ?? null,
        priority: (latest as any).priority ?? null,
        series_id,
        rolled_from_id: (latest as any).id as string,
        status: "todo",
      });
      if (insErr) throw insErr;
      return { inserted: 1 } as const;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["todos", vars.project_id] as any });
      qc.invalidateQueries({ queryKey: ["todo_dates", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["todos_weekly", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["feature_progress", vars.project_id] });
      qc.invalidateQueries({
        queryKey: ["feature_linked_todos", vars.project_id],
      });
    },
  });
}

export function useAssignTodoFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      project_id: string;
      date: string;
      feature_id: string | null;
    }) => {
      const { error } = await supabase
        .from("todos")
        .update({ feature_id: payload.feature_id })
        .eq("id", payload.id);
      if (error) throw error;
      return true as const;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["todos", vars.project_id, vars.date] });
      qc.invalidateQueries({ queryKey: ["todos_weekly", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["feature_progress", vars.project_id] });
      qc.invalidateQueries({
        queryKey: ["feature_linked_todos", vars.project_id],
      });
    },
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      project_id: string;
      date: string;
    }) => {
      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("id", payload.id);
      if (error) throw error;
      return true as const;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["todos", vars.project_id, vars.date] });
      qc.invalidateQueries({ queryKey: ["todo_dates", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["todos_weekly", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["feature_progress", vars.project_id] });
      qc.invalidateQueries({
        queryKey: ["feature_linked_todos", vars.project_id],
      });
    },
  });
}

export function useUpdateTodoPriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      project_id: string;
      date: string;
      priority: Priority;
    }) => {
      const { error } = await supabase
        .from("todos")
        .update({ priority: payload.priority })
        .eq("id", payload.id);
      if (error) throw error;
      return true as const;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["todos", vars.project_id, vars.date] });
      qc.invalidateQueries({ queryKey: ["todos_weekly", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["feature_progress", vars.project_id] });
      qc.invalidateQueries({
        queryKey: ["feature_linked_todos", vars.project_id],
      });
    },
  });
}

// ---- Infinite weekly loader grouped by date ----
function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + delta);
  return formatDate(d);
}

export function useInfiniteTodosByWeek(projectId: string | undefined) {
  type Page = { items: Todo[]; oldestDate: string | null };
  return useInfiniteQuery<
    Page,
    Error,
    Page,
    (string | undefined)[],
    string | undefined
  >({
    queryKey: ["todos_weekly", projectId],
    queryFn: async ({ pageParam }: { pageParam?: string }): Promise<Page> => {
      if (!projectId) return { items: [], oldestDate: null };
      const endDate = pageParam
        ? (pageParam as string)
        : formatDate(new Date());
      const startDate = addDays(endDate, -6);
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("project_id", projectId)
        .lte("date", endDate)
        .gte("date", startDate)
        .order("date", { ascending: false })
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      const items = (data ?? []) as Todo[];
      const oldestDate = items.length
        ? items.reduce((m, r) => (r.date < m ? r.date : m), items[0].date)
        : null;
      return { items, oldestDate } as Page;
    },
    getNextPageParam: (lastPage: Page) =>
      lastPage.oldestDate ? addDays(lastPage.oldestDate, -1) : undefined,
    initialPageParam: undefined,
    enabled: !!projectId,
    staleTime: 3000,
  });
}

// ---- Additional selectors built on todos ----
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
        .from("todos")
        .select("series_id, feature_id, status, date")
        .eq("project_id", projectId)
        .order("date", { ascending: true });
      if (error) throw error;
      const latestBySeries = new Map<string, any>();
      for (const row of (data ?? []) as any[]) {
        const sid = row.series_id as string;
        latestBySeries.set(sid, row); // ascending order ensures last wins
      }
      const map = new Map<string, { total: number; done: number }>();
      for (const row of Array.from(latestBySeries.values())) {
        const fid = row.feature_id as string | null;
        if (!fid) continue;
        const entry = map.get(fid) ?? { total: 0, done: 0 };
        entry.total += 1;
        if ((row.status as string) === "done") entry.done += 1;
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

export type FeatureLinkedTodo = {
  id: string;
  feature_id: string;
  title: string;
  status: "todo" | "done";
  priority?: Priority;
};

export function useFeatureLinkedTodos(projectId: string | undefined) {
  return useQuery<Record<string, FeatureLinkedTodo[]>>({
    queryKey: ["feature_linked_todos", projectId],
    queryFn: async () => {
      if (!projectId) return {};
      const { data, error } = await supabase
        .from("todos")
        .select("id, series_id, feature_id, title, status, priority, date")
        .eq("project_id", projectId)
        .not("feature_id", "is", null)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      const latestBySeries = new Map<string, any>();
      for (const row of (data ?? []) as any[]) {
        latestBySeries.set(row.series_id as string, row); // last wins
      }
      const map: Record<string, FeatureLinkedTodo[]> = {};
      for (const row of Array.from(latestBySeries.values())) {
        const fid = row.feature_id as string;
        (map[fid] ??= []).push({
          id: row.id as string,
          feature_id: fid,
          title: row.title as string,
          status: row.status as any,
          priority: row.priority as any,
        });
      }
      return map;
    },
    enabled: !!projectId,
    staleTime: 2000,
  });
}
