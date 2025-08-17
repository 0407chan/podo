import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { DailyTodosPanel } from "../components/projects/detail/DailyTodosPanel";
import { FeatureTodoList } from "../components/projects/detail/FeatureTodoList";
import { ProjectDetailLayout } from "../components/projects/detail/ProjectDetailLayout";
import { ProjectInfoCard } from "../components/projects/detail/ProjectInfoCard";
// useDailies 제거 → 날짜는 todos에서 distinct로 사용
import {
  useCreateFeature,
  useFeatures,
  useToggleFeature,
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
} from "../hooks/useTodos";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useProjects();
  const project = (data ?? []).find((p) => p.id === id);
  const projectId = project?.id;

  const { data: features = [] } = useFeatures(projectId);
  const { mutateAsync: createFeature } = useCreateFeature();
  const { mutateAsync: toggleFeature } = useToggleFeature();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // 주간 단위 무한 스크롤 로딩
  const weeklyTodos = useInfiniteTodosByWeek(projectId);
  const { mutateAsync: createTodo } = useCreateTodo();
  const { mutateAsync: toggleTodo } = useToggleTodoStatus();
  const { mutateAsync: assignTodoFeature } = useAssignTodoFeature();
  const { mutateAsync: deleteTodo } = useDeleteTodo();

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
            progressByFeature={progressByFeature}
            linkedTodosByFeature={linkedTodosMap}
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
          />
          <div ref={loadMoreRef} />
        </div>
      }
    />
  );
}
