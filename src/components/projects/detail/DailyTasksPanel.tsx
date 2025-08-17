import { Card, Checkbox, Input, List, Select } from "antd";
import { useState } from "react";
import type { DailyTask } from "../../../hooks/useDailyTasks";
import type { FeatureTodo } from "./FeatureTodoList";

type Props = {
  tasks: DailyTask[];
  onCreate: (title: string) => void;
  onToggle: (taskId: string) => void;
  onAssign: (taskId: string, featureId: string | null) => void;
  features: FeatureTodo[];
  title?: string;
  fillHeight?: boolean;
};

export function DailyTasksPanel({
  tasks,
  onCreate,
  onToggle,
  onAssign,
  features,
  title = "오늘 할 일",
  fillHeight,
}: Props) {
  const [cardTitle, setTitle] = useState(title);
  // map removed; options derive directly from props

  return (
    <Card
      title={cardTitle}
      style={fillHeight ? { height: "100%" } : undefined}
      bodyStyle={
        fillHeight
          ? { height: "100%", display: "flex", flexDirection: "column" }
          : undefined
      }
    >
      <Input.Search
        placeholder="할 일을 입력하고 Enter"
        value={cardTitle}
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
        style={{
          marginTop: 8,
          ...(fillHeight ? { flex: 1, overflow: "auto" } : {}),
        }}
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
              value={
                (t as any).feature_id ?? (t as any).feature_todo_id ?? undefined
              }
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
