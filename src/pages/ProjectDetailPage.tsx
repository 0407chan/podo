import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { DailyEditor } from "../components/projects/detail/DailyEditor";
import { DailyList } from "../components/projects/detail/DailyList";
import { DailyTasksPanel } from "../components/projects/detail/DailyTasksPanel";
import { FeatureTodoList } from "../components/projects/detail/FeatureTodoList";
import { LinkedTodosPanel } from "../components/projects/detail/LinkedTodosPanel";
import { ProjectDetailLayout } from "../components/projects/detail/ProjectDetailLayout";
import { ProjectInfoCard } from "../components/projects/detail/ProjectInfoCard";
import { useDailies, useUpsertDaily } from "../hooks/useDailies";
import {
  useAssignDailyTaskFeature,
  useCreateDailyTask,
  useDailyTasks,
  useToggleDailyTaskStatus,
} from "../hooks/useDailyTasks";
import {
  useDailyTodoLinks,
  useLinkDailyTodo,
  useUnlinkDailyTodo,
} from "../hooks/useDailyTodoLinks";
import { useFeatureLinkedTasks } from "../hooks/useFeatureLinkedTasks";
import { useFeatureProgress } from "../hooks/useFeatureProgress";
import {
  useCreateFeatureTodo,
  useFeatureTodos,
  useToggleFeatureTodo,
} from "../hooks/useFeatureTodos";
import { useProjects } from "../hooks/useProjects";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useProjects();
  const project = (data ?? []).find((p) => p.id === id);
  const projectId = project?.id;

  const { data: todos = [] } = useFeatureTodos(projectId);
  const { mutateAsync: createTodo } = useCreateFeatureTodo();
  const { mutateAsync: toggleTodo } = useToggleFeatureTodo();

  const { data: dailies = [] } = useDailies(projectId);
  const { mutateAsync: upsertDaily } = useUpsertDaily();

  const dates = useMemo(() => dailies.map((d) => d.date), [dailies]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draftContentByDate, setDraftContentByDate] = useState<
    Record<string, string>
  >({});
  const selectedDaily = useMemo(
    () => dailies.find((d) => d.date === selectedDate),
    [dailies, selectedDate]
  );

  const selectedDailyId = selectedDaily?.id;
  const { data: links = [] } = useDailyTodoLinks(selectedDailyId);
  const linkedTodoIds = useMemo(
    () => links.map((l) => l.feature_todo_id),
    [links]
  );
  const { mutateAsync: linkTodo } = useLinkDailyTodo();
  const { mutateAsync: unlinkTodo } = useUnlinkDailyTodo();

  const { data: tasks = [] } = useDailyTasks(selectedDailyId);
  const { mutateAsync: createTask } = useCreateDailyTask();
  const { mutateAsync: toggleTask } = useToggleDailyTaskStatus();
  const { mutateAsync: assignTaskFeature } = useAssignDailyTaskFeature();

  const { data: progress = [] } = useFeatureProgress(projectId);
  const { data: linkedTasksMap = {} } = useFeatureLinkedTasks(projectId);
  const progressByFeature = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const p of progress)
      map[p.feature_id] = { total: p.total, done: p.done };
    return map;
  }, [progress]);

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

  const handleSelectDate = (date: string) => setSelectedDate(date);

  const handleCreateToday = async () => {
    if (!projectId) return;
    const today = new Date().toISOString().slice(0, 10);
    const initial = draftContentByDate[today] ?? selectedDaily?.content ?? "";
    await upsertDaily({ project_id: projectId, date: today, content: initial });
    setSelectedDate(today);
  };

  const handleContentChange = (value: string) => {
    if (!selectedDate) return;
    setDraftContentByDate((prev) => ({ ...prev, [selectedDate]: value }));
  };

  const handleSave = async () => {
    if (!projectId || !selectedDate) return;
    const content =
      draftContentByDate[selectedDate] ?? selectedDaily?.content ?? "";
    await upsertDaily({ project_id: projectId, date: selectedDate, content });
  };

  const handleLinkTodo = async (todoId: string) => {
    if (!selectedDailyId) return;
    await linkTodo({ daily_id: selectedDailyId, feature_todo_id: todoId });
  };

  const handleUnlinkTodo = async (todoId: string) => {
    if (!selectedDailyId) return;
    await unlinkTodo({ daily_id: selectedDailyId, feature_todo_id: todoId });
  };

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
          />
        </>
      }
      right={
        <>
          <DailyTasksPanel
            tasks={tasks}
            onCreate={async (title) => {
              if (!projectId || !selectedDailyId) return;
              await createTask({
                project_id: projectId,
                daily_id: selectedDailyId,
                title,
              });
            }}
            onToggle={async (taskId) => {
              if (!selectedDailyId) return;
              if (!projectId) return;
              await toggleTask({
                id: taskId,
                daily_id: selectedDailyId,
                project_id: projectId,
              });
            }}
            onAssign={async (taskId, featureId) => {
              if (!selectedDailyId) return;
              if (!projectId) return;
              await assignTaskFeature({
                id: taskId,
                daily_id: selectedDailyId,
                project_id: projectId,
                feature_todo_id: featureId,
              });
            }}
            features={todos}
          />
          <LinkedTodosPanel
            allTodos={todos}
            linkedTodoIds={linkedTodoIds}
            onToggleStatus={handleToggleTodo}
            onLink={handleLinkTodo}
            onUnlink={handleUnlinkTodo}
          />
          <DailyEditor
            dates={dates}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            content={
              selectedDate
                ? draftContentByDate[selectedDate] ??
                  selectedDaily?.content ??
                  ""
                : ""
            }
            onChangeContent={handleContentChange}
            onSave={handleSave}
            onCreateToday={handleCreateToday}
          />
          <DailyList
            items={dailies.map((d) => ({
              date: d.date,
              contentSnippet: d.content.slice(0, 80),
            }))}
            onSelect={handleSelectDate}
          />
        </>
      }
    />
  );
}
