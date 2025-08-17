import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Checkbox, Input, List, Popconfirm, Progress, Typography } from "antd";
import { useMemo, useState } from "react";
const { Text } = Typography;

export type FeatureTodo = {
  id: string;
  project_id: string;
  title: string;
  status: "todo" | "done";
};

type Props = {
  projectId: string;
  features: FeatureTodo[];
  onCreate: (title: string) => void;
  onToggle: (id: string) => void;
  progressByFeature?: Record<string, { total: number; done: number }>;
  linkedTodosByFeature?: Record<
    string,
    { id: string; title: string; status: "todo" | "in_progress" | "done" }[]
  >;
  onQuickAddTodo?: (featureId: string, title: string) => void;
  onJumpToTodo?: (todoId: string) => void;
  onDelete?: (id: string) => void;
};

export function FeatureTodoList({
  projectId: _projectId,
  features,
  onCreate,
  onToggle,
  progressByFeature,
  linkedTodosByFeature,
  onQuickAddTodo,
  onJumpToTodo,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  const [quickAddFor, setQuickAddFor] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState<string>("");

  const data = useMemo(() => features, [features]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        border: "1px solid var(--ant-color-border, #f0f0f0)",
        borderRadius: 8,
        background: "var(--ant-color-bg-container, #fff)",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          fontSize: 14,
          fontWeight: 600,
          borderBottom: "1px solid var(--ant-color-split, #f0f0f0)",
        }}
      >
        ⭐️ Features
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "0 8px",
        }}
      >
        <List
          dataSource={data}
          style={{ flex: 1, minHeight: 0 }}
          renderItem={(t) => {
            const prog = progressByFeature?.[t.id];
            const percent =
              prog && prog.total > 0
                ? Math.round((prog.done / prog.total) * 100)
                : 0;
            return (
              <List.Item style={{ display: "block", overflow: "visible" }}>
                <div
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    background: "var(--ant-color-bg-container, #fff)",
                    padding: "8px 0",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Checkbox
                      checked={t.status === "done"}
                      onChange={() => onToggle(t.id)}
                    >
                      <Text delete={t.status === "done"}>{t.title}</Text>
                    </Checkbox>
                    {prog ? (
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, marginRight: "auto" }}
                      >
                        {prog.done}/{prog.total}
                      </Text>
                    ) : (
                      <div style={{ marginRight: "auto" }} />
                    )}

                    <button
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "var(--ant-color-primary, #1677ff)",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                      onClick={() => {
                        setQuickAddFor((prev) => (prev === t.id ? null : t.id));
                        setQuickTitle("");
                      }}
                      title="오늘 TODO 추가"
                    >
                      <PlusOutlined />
                    </button>
                    <Popconfirm
                      title="이 feature를 삭제할까?"
                      description={`연결된 오늘 할 일은 링크만 해제돼요.`}
                      okText="삭제"
                      cancelText="취소"
                      placement="left"
                      onConfirm={() => {
                        setQuickAddFor(null);
                        onDelete?.(t.id);
                      }}
                    >
                      <button
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "var(--ant-color-error, #ff4d4f)",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                        title="Feature 삭제"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                  {quickAddFor === t.id && (
                    <div style={{ marginTop: 8 }}>
                      <Input.Search
                        placeholder="오늘 할 일"
                        value={quickTitle}
                        onChange={(e) => setQuickTitle(e.target.value)}
                        onSearch={(val) => {
                          const v = val.trim();
                          if (!v) return;
                          onQuickAddTodo?.(t.id, v);
                          setQuickTitle("");
                          setQuickAddFor(null);
                        }}
                        enterButton="추가"
                        autoFocus
                      />
                    </div>
                  )}
                  {prog && prog.total > 0 && (
                    <Progress percent={percent} size="small" showInfo={false} />
                  )}
                </div>
                {linkedTodosByFeature?.[t.id]?.length ? (
                  <List
                    size="small"
                    split={false}
                    dataSource={linkedTodosByFeature[t.id]}
                    renderItem={(lt) => (
                      <List.Item style={{ paddingLeft: 24 }}>
                        <Checkbox
                          checked={lt.status === "done"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onJumpToTodo?.(lt.id);
                          }}
                        >
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 12,
                              textDecoration:
                                lt.status === "done" ? "line-through" : "none",
                            }}
                          >
                            {lt.title}
                          </Text>
                        </Checkbox>
                      </List.Item>
                    )}
                  />
                ) : null}
              </List.Item>
            );
          }}
        />
      </div>

      <div
        style={{
          padding: 12,
          borderTop: "1px solid var(--ant-color-split, #f0f0f0)",
        }}
      >
        <Input.Search
          placeholder="새 Feature TODO"
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
      </div>
    </div>
  );
}
