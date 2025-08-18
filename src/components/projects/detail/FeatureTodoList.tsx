import { useSettingsStore } from "@/stores/useSettingsStore";
import type { Priority } from "@/types/literal";
import {
  DeleteOutlined,
  EyeInvisibleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Input,
  List,
  Popconfirm,
  Progress,
  Tooltip,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
const { Text } = Typography;

export type FeatureTodo = {
  id: string;
  project_id: string;
  title: string;
  status: "todo" | "done";
  priority?: "highest" | "high" | "normal" | "low" | "lowest";
};

type Props = {
  projectId: string;
  features: FeatureTodo[];
  onCreate: (title: string) => void;
  onToggle: (id: string) => void;
  onChangePriority?: (id: string, priority: FeatureTodo["priority"]) => void;
  progressByFeature?: Record<string, { total: number; done: number }>;
  linkedTodosByFeature?: Record<
    string,
    {
      id: string;
      title: string;
      status: "todo" | "in_progress" | "done";
      priority?: Priority;
    }[]
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
  // onChangePriority,
  progressByFeature,
  linkedTodosByFeature,
  onQuickAddTodo,
  onJumpToTodo,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  const [quickAddFor, setQuickAddFor] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState<string>("");
  const [hideDoneFeatures] = useState(false);
  const hideDoneLinkedTodos = useSettingsStore((s) => s.hideDoneLinkedTodos);
  const toggleHideDoneLinkedTodos = useSettingsStore(
    (s) => s.toggleHideDoneLinkedTodos
  );
  // const [priorityFor, setPriorityFor] = useState<string | null>(null);

  const data = useMemo(
    () =>
      hideDoneFeatures ? features.filter((f) => f.status !== "done") : features,
    [features, hideDoneFeatures]
  );

  const dataSorted = useMemo(() => {
    const weight = (p: FeatureTodo["priority"]) => {
      switch (p ?? "normal") {
        case "highest":
          return 1;
        case "high":
          return 2;
        case "normal":
          return 3;
        case "low":
          return 4;
        case "lowest":
          return 5;
        default:
          return 3;
      }
    };
    return data
      .map((it, idx) => ({ it, idx }))
      .sort((a, b) => {
        const wa = weight(a.it.priority);
        const wb = weight(b.it.priority);
        if (wa !== wb) return wa - wb;
        return a.idx - b.idx; // preserve incoming order (created_at asc)
      })
      .map((x) => x.it);
  }, [data]);

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
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span style={{ marginRight: "auto" }}>⭐️ Features</span>
        <Tooltip title="완료된 todo 숨기기">
          <Button
            aria-label="완료된 todo 숨기기"
            type="text"
            size="small"
            style={{
              color: hideDoneLinkedTodos
                ? "var(--ant-color-primary, #1677ff)"
                : "var(--ant-color-text, rgba(0,0,0,.88))",
            }}
            icon={<EyeInvisibleOutlined />}
            onClick={toggleHideDoneLinkedTodos}
          />
        </Tooltip>
        {/* <Tooltip title="완료된 feature 숨기기">
          <button
            aria-label="완료된 feature 숨기기"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 4,
              color: hideDoneFeatures
                ? "var(--ant-color-primary, #1677ff)"
                : "var(--ant-color-text, rgba(0,0,0,.88))",
            }}
            onClick={() => setHideDoneFeatures((v) => !v)}
          >
            <EyeInvisibleOutlined />
          </button>
        </Tooltip> */}
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
          dataSource={dataSorted}
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
                    {/* <Select
                      size="small"
                      value={t.priority ?? "normal"}
                      onChange={(val) => {
                        onChangePriority?.(t.id, val as any);
                        setPriorityFor(null);
                      }}
                      showAction={["click"]}
                      variant="borderless"
                      onBlur={() => setPriorityFor(null)}
                      style={{ width: 120 }}
                      popupMatchSelectWidth={false}
                      labelRender={(label) =>
                        priorityOptions[
                          label.value as keyof typeof priorityOptions
                        ]
                      }
                      options={[
                        { value: "highest", label: "최상" },
                        { value: "high", label: "상" },
                        { value: "normal", label: "보통" },
                        { value: "low", label: "하" },
                        { value: "lowest", label: "최하" },
                      ]}
                    /> */}
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
                {(hideDoneLinkedTodos
                  ? linkedTodosByFeature?.[t.id]?.filter(
                      (lt) => lt.status !== "done"
                    )
                  : linkedTodosByFeature?.[t.id]
                )?.length ? (
                  <List
                    size="small"
                    split={false}
                    dataSource={
                      hideDoneLinkedTodos
                        ? linkedTodosByFeature?.[t.id]?.filter(
                            (lt) => lt.status !== "done"
                          )
                        : linkedTodosByFeature?.[t.id]
                    }
                    renderItem={(lt) => (
                      <List.Item
                        style={{
                          paddingLeft: 16,
                        }}
                      >
                        <Checkbox
                          checked={lt.status === "done"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onJumpToTodo?.(lt.id);
                          }}
                        >
                          <img
                            src={`/images/${lt.priority ?? "normal"}.png`}
                            alt={lt.priority ?? "normal"}
                            style={{ width: 16, height: 16, marginRight: 4 }}
                          />
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
