import type { Todo } from "@/hooks/useTodos";
import { DeleteOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Input,
  List,
  Popconfirm,
  Select,
  Tag,
  Tooltip,
} from "antd";
import { useMemo, useState } from "react";
import type { FeatureTodo } from "./FeatureTodoList";

type Props = {
  todos: Todo[];
  onCreate: (date: string, title: string) => void;
  onToggle: (todoId: string) => void;
  onAssign: (todoId: string, featureId: string | null) => void;
  onDelete: (todoId: string) => void;
  features: FeatureTodo[];
  registerTodoEl?: (todoId: string, el: HTMLElement | null) => void;
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

export function DailyTodosPanel({
  todos,
  onCreate,
  onToggle,
  onAssign,
  onDelete,
  features,
  registerTodoEl,
}: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [hideDoneTodos, setHideDoneTodos] = useState(false);

  const grouped = useMemo(() => {
    const filtered = hideDoneTodos
      ? todos.filter((t) => t.status !== "done")
      : todos;
    const map = new Map<string, Todo[]>();
    for (const t of filtered) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    const entries = Array.from(map.entries()).sort(([a], [b]) =>
      a > b ? -1 : a < b ? 1 : 0
    );
    return entries;
  }, [todos, hideDoneTodos]);

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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{ fontSize: 14, fontWeight: 600, marginRight: "auto" }}
              >
                {formatLabel(date)}
              </div>
              <Tooltip title="완료된 todo 숨기기" placement="left">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeInvisibleOutlined />}
                  aria-label="완료된 todo 숨기기"
                  style={{
                    color: hideDoneTodos
                      ? "var(--ant-color-primary, #1677ff)"
                      : "var(--ant-color-text, rgba(0,0,0,.88))",
                  }}
                  onClick={() => setHideDoneTodos((v) => !v)}
                />
              </Tooltip>
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
          <div style={{ padding: "0 12px" }}>
            <List
              dataSource={items}
              locale={{ emptyText: "오늘 할 일이 없어" }}
              renderItem={(t) => (
                <span
                  ref={(el) => registerTodoEl?.(t.id, el)}
                  data-todo-id={t.id}
                  tabIndex={-1}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <List.Item
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr minmax(120px, 160px) auto",
                      gap: 8,
                      alignItems: "center",
                      width: "100%",
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
                    {assignFor === t.id ? (
                      <Select
                        size="small"
                        value={t.feature_id ?? undefined}
                        onChange={(val) => {
                          onAssign(t.id, (val as string) || null);
                          setAssignFor(null);
                        }}
                        allowClear
                        showSearch
                        placeholder="연결 안 함"
                        style={{ width: 140 }}
                        dropdownMatchSelectWidth={false}
                        options={features.map((f) => ({
                          value: f.id,
                          label: f.title,
                        }))}
                        onBlur={() => setAssignFor(null)}
                      />
                    ) : (
                      <Tag
                        onClick={() => setAssignFor(t.id)}
                        style={{ cursor: "pointer", width: "fit-content" }}
                        color={t.feature_id ? "blue" : undefined}
                      >
                        {t.feature_id
                          ? features.find((f) => f.id === t.feature_id)
                              ?.title || "연결됨"
                          : "연결 안 함"}
                      </Tag>
                    )}
                    <div
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      <Popconfirm
                        title="삭제하시겠습니까?"
                        okText="삭제"
                        cancelText="취소"
                        okButtonProps={{ danger: true }}
                        placement="topRight"
                        onConfirm={() => onDelete(t.id)}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </div>
                  </List.Item>
                </span>
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
