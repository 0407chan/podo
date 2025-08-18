import type { Priority } from "@/types/literal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { DailyTodosPanel } from "../components/projects/detail/DailyTodosPanel";
import { FeatureTodoList } from "../components/projects/detail/FeatureTodoList";
import { ProjectDetailLayout } from "../components/projects/detail/ProjectDetailLayout";
import { ProjectInfoCard } from "../components/projects/detail/ProjectInfoCard";
import {
  useCreateFeature,
  useDeleteFeature,
  useFeatures,
  useToggleFeature,
  useUpdateFeaturePriority,
} from "../hooks/useFeatures";
import { useProjects } from "../hooks/useProjects";
import {
  useAssignTodoFeature,
  useCreateTodo,
  useDeleteTodo,
  useFeatureLinkedTodos,
  useFeatureProgress,
  useInfiniteTodosByWeek,
  useToggleTodoStatus,
  useUpdateTodoPriority,
} from "../hooks/useTodos";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useProjects();
  const project = (data ?? []).find((p) => p.id === id);
  const projectId = project?.id;

  const { data: features = [] } = useFeatures(projectId);
  const { mutateAsync: createFeature } = useCreateFeature();
  const { mutateAsync: toggleFeature } = useToggleFeature();
  const { mutateAsync: deleteFeature } = useDeleteFeature();
  const { mutateAsync: updateFeaturePriority } = useUpdateFeaturePriority();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // 주간 단위 무한 스크롤 로딩
  const weeklyTodos = useInfiniteTodosByWeek(projectId);
  const { mutateAsync: createTodo } = useCreateTodo();
  const { mutateAsync: toggleTodo } = useToggleTodoStatus();
  const { mutateAsync: assignTodoFeature } = useAssignTodoFeature();
  const { mutateAsync: deleteTodo } = useDeleteTodo();
  const { mutateAsync: updateTodoPriority } = useUpdateTodoPriority();

  const { data: progress = [] } = useFeatureProgress(projectId);
  const { data: linkedTodosMap = {} } = useFeatureLinkedTodos(projectId);
  const progressByFeature = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const p of progress)
      map[p.feature_id] = { total: p.total, done: p.done };
    return map;
  }, [progress]);

  useEffect(() => {
    console.log(weeklyTodos.data, selectedDate);
  }, [weeklyTodos.data, selectedDate]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          weeklyTodos.hasNextPage &&
          !weeklyTodos.isFetchingNextPage
        ) {
          weeklyTodos.fetchNextPage();
        }
      },
      { root: null, rootMargin: "600px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [weeklyTodos.hasNextPage, weeklyTodos.isFetchingNextPage]);

  useEffect(() => {
    if (!selectedDate) {
      const pages = (weeklyTodos.data as any)?.pages ?? [];
      const first = (pages?.[0]?.items ?? []).at(0)?.date as string | undefined;
      if (first) setSelectedDate(first);
    }
  }, [weeklyTodos.data, selectedDate]);

  // ---- Cross-panel focus & highlight for actual daily todo items ----
  const todoElMapRef = useRef<Map<string, HTMLElement>>(new Map());
  const registerTodoEl = useCallback(
    (todoId: string, el: HTMLElement | null) => {
      const map = todoElMapRef.current;
      if (!el) {
        map.delete(todoId);
        return;
      }
      map.set(todoId, el);
    },
    []
  );

  const focusTodoById = useCallback(
    async (todoId: string) => {
      const tryHighlight = (el: HTMLElement) => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // allow keyboard focus outline too
        if (typeof el.focus === "function") {
          el.focus({ preventScroll: true } as any);
        }
        // retrigger animation
        el.classList.remove("flash-highlight");
        // force reflow to restart CSS animation
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        (el as any).offsetWidth;
        el.classList.add("flash-highlight");
        // ensure cleanup after animation finishes (in case CSS changes)
        const handle = window.setTimeout(() => {
          el.classList.remove("flash-highlight");
        }, 1300);
        // best-effort: clear if re-triggered before timeout
        (el as any)._fh_to && window.clearTimeout((el as any)._fh_to);
        (el as any)._fh_to = handle;
      };

      let el: HTMLElement | undefined = todoElMapRef.current.get(todoId);
      if (el) {
        tryHighlight(el);
        return;
      }

      // Not found in DOM: try to fetch older pages a few times
      let attempts = 0;
      const maxAttempts = 4;
      while (!el && attempts < maxAttempts && weeklyTodos.hasNextPage) {
        attempts += 1;
        await weeklyTodos.fetchNextPage();
        // wait a tick for DOM to render
        await new Promise((r) => setTimeout(r, 0));
        el = todoElMapRef.current.get(todoId);
      }
      if (el) tryHighlight(el);
    },
    [weeklyTodos]
  );

  if (!id) return <div>No project selected</div>;
  if (!project) return <div>Loading project...</div>;

  const handleCreateFeature = async (title: string) => {
    if (!projectId) return;
    await createFeature({ project_id: projectId, title });
  };

  const handleToggleFeature = async (todoId: string) => {
    if (!projectId) return;
    await toggleFeature({ id: todoId, project_id: projectId });
  };

  // Daily Editor 제거됨(카드 삭제). 위 핸들러들은 현재 미사용이라 정리

  return (
    <ProjectDetailLayout
      left={
        <>
          <ProjectInfoCard project={project} />
          <FeatureTodoList
            projectId={project.id}
            features={features}
            onCreate={handleCreateFeature}
            onToggle={handleToggleFeature}
            onChangePriority={async (featureId, priority) => {
              if (!projectId) return;
              await updateFeaturePriority({
                id: featureId,
                project_id: projectId,
                priority: (priority ?? "normal") as Priority,
              });
            }}
            progressByFeature={progressByFeature}
            linkedTodosByFeature={linkedTodosMap}
            onJumpToTodo={(todoId) => {
              void focusTodoById(todoId);
            }}
            onQuickAddTodo={async (featureId: string, title: string) => {
              if (!projectId) return;
              const today = (() => {
                const d = new Date();
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                return `${yyyy}-${mm}-${dd}`;
              })();
              await createTodo({
                project_id: projectId,
                date: today,
                title,
                feature_id: featureId,
              });
            }}
            onDelete={async (featureId) => {
              if (!projectId) return;
              await deleteFeature({ id: featureId, project_id: projectId });
            }}
          />
        </>
      }
      right={
        <div
          style={{
            display: "grid",
            gap: 12,
            gridAutoRows: "min-content",
          }}
        >
          <DailyTodosPanel
            todos={(() => {
              const pages = (weeklyTodos.data as any)?.pages ?? [];
              return pages.flatMap((p: any) => p.items) as any[];
            })()}
            registerTodoEl={registerTodoEl}
            onCreate={async (date, title) => {
              if (!projectId) return;
              if (selectedDate !== date) setSelectedDate(date);
              await createTodo({ project_id: projectId, date, title });
            }}
            onToggle={async (todoId) => {
              if (!projectId || !selectedDate) return;
              const pages = (weeklyTodos.data as any)?.pages ?? [];
              const all = pages.flatMap((p: any) => p.items) as any[];
              const cur = all.find((t) => t.id === todoId);
              const date = cur?.date ?? selectedDate;
              await toggleTodo({ id: todoId, project_id: projectId, date });
            }}
            onAssign={async (todoId, featureId) => {
              if (!projectId || !selectedDate) return;
              const pages = (weeklyTodos.data as any)?.pages ?? [];
              const all = pages.flatMap((p: any) => p.items) as any[];
              const cur = all.find((t) => t.id === todoId);
              const date = cur?.date ?? selectedDate;
              await assignTodoFeature({
                id: todoId,
                project_id: projectId,
                date,
                feature_id: featureId,
              });
            }}
            onDelete={async (todoId) => {
              if (!projectId || !selectedDate) return;
              const pages = (weeklyTodos.data as any)?.pages ?? [];
              const all = pages.flatMap((p: any) => p.items) as any[];
              const cur = all.find((t) => t.id === todoId);
              const date = cur?.date ?? selectedDate;
              await deleteTodo({ id: todoId, project_id: projectId, date });
            }}
            features={features}
            onChangePriority={async (todoId, priority) => {
              if (!projectId || !selectedDate) return;
              const pages = (weeklyTodos.data as any)?.pages ?? [];
              const all = pages.flatMap((p: any) => p.items) as any[];
              const cur = all.find((t) => t.id === todoId);
              const date = cur?.date ?? selectedDate;
              await updateTodoPriority({
                id: todoId,
                project_id: projectId,
                date,
                priority,
              });
            }}
          />
          <div ref={loadMoreRef} />
        </div>
      }
    />
  );
}
