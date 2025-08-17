import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { DailyTasksPanel } from "../components/projects/detail/DailyTasksPanel";
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
  useFeatureLinkedTasks,
  useFeatureProgress,
  useInfiniteTodosByWeek,
  useToggleTodoStatus,
} from "../hooks/useTodos";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useProjects();
  const project = (data ?? []).find((p) => p.id === id);
  const projectId = project?.id;

  const { data: todos = [] } = useFeatures(projectId);
  const { mutateAsync: createTodo } = useCreateFeature();
  const { mutateAsync: toggleTodo } = useToggleFeature();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // 주간 단위 무한 스크롤 로딩
  const weekly = useInfiniteTodosByWeek(projectId);
  const { mutateAsync: createTask } = useCreateTodo();
  const { mutateAsync: toggleTask } = useToggleTodoStatus();
  const { mutateAsync: assignTaskFeature } = useAssignTodoFeature();

  const { data: progress = [] } = useFeatureProgress(projectId);
  const { data: linkedTasksMap = {} } = useFeatureLinkedTasks(projectId);
  const progressByFeature = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const p of progress)
      map[p.feature_id] = { total: p.total, done: p.done };
    return map;
  }, [progress]);

  useEffect(() => {
    console.log(weekly.data, selectedDate);
  }, [weekly.data, selectedDate]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          weekly.hasNextPage &&
          !weekly.isFetchingNextPage
        ) {
          weekly.fetchNextPage();
        }
      },
      { root: null, rootMargin: "600px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [weekly.hasNextPage, weekly.isFetchingNextPage]);

  useEffect(() => {
    if (!selectedDate) {
      const pages = (weekly.data as any)?.pages ?? [];
      const first = (pages?.[0]?.items ?? []).at(0)?.date as string | undefined;
      if (first) setSelectedDate(first);
    }
  }, [weekly.data, selectedDate]);

  if (!id) return <div>No project selected</div>;
  if (!project) return <div>Loading project...</div>;

  const handleCreateTodo = async (title: string) => {
    if (!projectId) return;
    await createTodo({ project_id: projectId, title });
  };

  const handleToggleTodo = async (todoId: string) => {
    if (!projectId) return;
    await toggleTodo({ id: todoId, project_id: projectId });
  };

  // Daily Editor 제거됨(카드 삭제). 위 핸들러들은 현재 미사용이라 정리

  return (
    <ProjectDetailLayout
      left={
        <>
          <ProjectInfoCard project={project} />
          <FeatureTodoList
            projectId={project.id}
            todos={todos}
            onCreate={handleCreateTodo}
            onToggle={handleToggleTodo}
            progressByFeature={progressByFeature}
            linkedTasksByFeature={linkedTasksMap}
            fillHeight
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
          <DailyTasksPanel
            tasks={(() => {
              const pages = (weekly.data as any)?.pages ?? [];
              return pages.flatMap((p: any) => p.items) as any[];
            })()}
            onCreate={async (date, title) => {
              if (!projectId) return;
              if (selectedDate !== date) setSelectedDate(date);
              await createTask({ project_id: projectId, date, title });
            }}
            onToggle={async (taskId) => {
              if (!projectId || !selectedDate) return;
              const pages = (weekly.data as any)?.pages ?? [];
              const all = pages.flatMap((p: any) => p.items) as any[];
              const cur = all.find((t) => t.id === taskId);
              const date = cur?.date ?? selectedDate;
              await toggleTask({ id: taskId, project_id: projectId, date });
            }}
            onAssign={async (taskId, featureId) => {
              if (!projectId || !selectedDate) return;
              const pages = (weekly.data as any)?.pages ?? [];
              const all = pages.flatMap((p: any) => p.items) as any[];
              const cur = all.find((t) => t.id === taskId);
              const date = cur?.date ?? selectedDate;
              await assignTaskFeature({
                id: taskId,
                project_id: projectId,
                date,
                feature_id: featureId,
              });
            }}
            features={todos}
          />
          <div ref={loadMoreRef} />
        </div>
      }
    />
  );
}
