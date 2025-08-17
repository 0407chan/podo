import type { Todo } from "@/hooks/useTodos";
import { Checkbox, Input, List, Select } from "antd";
import { useMemo, useState } from "react";
import type { FeatureTodo } from "./FeatureTodoList";

type Props = {
  tasks: Todo[];
  onCreate: (date: string, title: string) => void;
  onToggle: (taskId: string) => void;
  onAssign: (taskId: string, featureId: string | null) => void;
  features: FeatureTodo[];
};

function formatLabel(date: string): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date(date);
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const label = `${d.getMonth() + 1}.${d.getDate()} (${days[d.getDay()]})`;
  return date === todayStr ? `${label} 오늘` : label;
}

export function DailyTasksPanel({
  tasks,
  onCreate,
  onToggle,
  onAssign,
  features,
}: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const grouped = useMemo(() => {
    const map = new Map<string, Todo[]>();
    for (const t of tasks) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    const entries = Array.from(map.entries()).sort(([a], [b]) =>
      a > b ? -1 : a < b ? 1 : 0
    );
    return entries;
  }, [tasks]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        gridAutoRows: "min-content",
      }}
    >
      {grouped.map(([date, items]) => (
        <div
          key={date}
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 16,
              zIndex: 5,
              background: "#ffffff",
              padding: "8px 12px 12px 12px",
              borderRadius: 8,
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              {formatLabel(date)}
            </div>
            <Input.Search
              placeholder={`${date} 할 일`}
              value={inputs[date] ?? ""}
              onChange={(e) =>
                setInputs((s) => ({ ...s, [date]: e.target.value }))
              }
              onSearch={(val) => {
                const v = val.trim();
                if (!v) return;
                onCreate(date, v);
                setInputs((s) => ({ ...s, [date]: "" }));
              }}
              enterButton="추가"
            />
          </div>
          <div style={{ padding: 12 }}>
            <List
              style={{ marginTop: 8 }}
              dataSource={items}
              locale={{ emptyText: "오늘 할 일이 없어" }}
              renderItem={(t) => (
                <List.Item
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr minmax(160px, 220px)",
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
                    value={t.feature_id ?? undefined}
                    onChange={(val) => onAssign(t.id, (val as string) || null)}
                    allowClear
                    placeholder="연결 안 함"
                    style={{ width: "100%" }}
                    options={features.map((f) => ({
                      value: f.id,
                      label: f.title,
                    }))}
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
