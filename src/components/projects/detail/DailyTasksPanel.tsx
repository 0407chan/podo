import { Card, Checkbox, Input, List, Select } from "antd";
import { useMemo, useState } from "react";
import type { DailyTask } from "../../../hooks/useDailyTasks";
import type { FeatureTodo } from "./FeatureTodoList";

type Props = {
  tasks: DailyTask[];
  onCreate: (title: string) => void;
  onToggle: (taskId: string) => void;
  onAssign: (taskId: string, featureId: string | null) => void;
  features: FeatureTodo[];
};

export function DailyTasksPanel({
  tasks,
  onCreate,
  onToggle,
  onAssign,
  features,
}: Props) {
  const [title, setTitle] = useState("");
  const featureMap = useMemo(
    () => new Map(features.map((f) => [f.id, f])),
    [features]
  );

  return (
    <Card title="오늘 할 일">
      <Input.Search
        placeholder="할 일을 입력하고 Enter"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onSearch={(val) => {
          const v = val.trim();
          if (!v) return;
          onCreate(v);
          setTitle("");
        }}
        enterButton="추가"
      />

      <List
        style={{ marginTop: 8 }}
        dataSource={tasks}
        locale={{ emptyText: "오늘 할 일이 없어" }}
        renderItem={(t) => (
          <List.Item
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr 200px",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Checkbox
              checked={t.status === "done"}
              onChange={() => onToggle(t.id)}
            />
            <div
              style={{
                textDecoration:
                  t.status === "done" ? "line-through" : undefined,
              }}
            >
              {t.title}
            </div>
            <Select
              value={t.feature_todo_id ?? undefined}
              onChange={(val) => onAssign(t.id, (val as string) || null)}
              allowClear
              placeholder="연결 안 함"
              options={features.map((f) => ({ value: f.id, label: f.title }))}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
