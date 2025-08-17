import { useEffect, useMemo, useState } from "react";
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
  useTodoDates,
  useTodos,
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

  const { data: dates = [] } = useTodoDates(projectId);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // content editor 제거로 임시 상태 제거

  const { data: tasks = [] } = useTodos(projectId, selectedDate ?? undefined);
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
    console.log(tasks, selectedDate);
  }, [tasks, selectedDate]);

  useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

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
        <div
          style={{
            display: "grid",
            gridTemplateRows: "auto 1fr",
            gap: 12,
            height: "100%",
          }}
        >
          <div style={{ minHeight: 0 }}>
            <ProjectInfoCard project={project} />
          </div>
          <div style={{ minHeight: 0 }}>
            <FeatureTodoList
              projectId={project.id}
              todos={todos}
              onCreate={handleCreateTodo}
              onToggle={handleToggleTodo}
              progressByFeature={progressByFeature}
              linkedTasksByFeature={linkedTasksMap}
              fillHeight
            />
          </div>
        </div>
      }
      right={
        <div
          style={{
            height: "100%",
            overflow: "auto",
            display: "grid",
            gap: 12,
            gridAutoRows: "min-content",
          }}
        >
          {dates.map((d) => (
            <DailyTasksPanel
              key={d}
              title={`${d} 할 일`}
              tasks={selectedDate === d ? tasks : []}
              onCreate={async (title) => {
                if (!projectId) return;
                if (selectedDate !== d) setSelectedDate(d);
                await createTask({
                  project_id: projectId,
                  date: d,
                  title,
                });
              }}
              onToggle={async (taskId) => {
                if (!projectId) return;
                await toggleTask({
                  id: taskId,
                  project_id: projectId,
                  date: d,
                });
              }}
              onAssign={async (taskId, featureId) => {
                if (!projectId) return;
                await assignTaskFeature({
                  id: taskId,
                  project_id: projectId,
                  date: d,
                  feature_id: featureId,
                });
              }}
              features={todos}
            />
          ))}
        </div>
      }
    />
  );
}
