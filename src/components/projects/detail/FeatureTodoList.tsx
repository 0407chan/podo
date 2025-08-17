import { Card, Checkbox, Input, List, Progress, Typography } from "antd";
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
  todos: FeatureTodo[];
  onCreate: (title: string) => void;
  onToggle: (id: string) => void;
  progressByFeature?: Record<string, { total: number; done: number }>;
  linkedTasksByFeature?: Record<
    string,
    { id: string; title: string; status: "todo" | "in_progress" | "done" }[]
  >;
  fillHeight?: boolean;
};

export function FeatureTodoList({
  projectId: _projectId,
  todos,
  onCreate,
  onToggle,
  progressByFeature,
  linkedTasksByFeature,
  fillHeight,
}: Props) {
  const [title, setTitle] = useState("");

  const data = useMemo(() => todos, [todos]);

  return (
    <Card
      title="Feature TODOs"
      style={fillHeight ? { height: "100%" } : undefined}
      styles={{
        body: fillHeight
          ? {
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }
          : undefined,
      }}
    >
      <List
        dataSource={data}
        style={fillHeight ? { flex: 1, overflow: "auto" } : undefined}
        renderItem={(t) => {
          const prog = progressByFeature?.[t.id];
          const percent =
            prog && prog.total > 0
              ? Math.round((prog.done / prog.total) * 100)
              : 0;
          return (
            <List.Item style={{ display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Checkbox
                  checked={t.status === "done"}
                  onChange={() => onToggle(t.id)}
                >
                  <Text delete={t.status === "done"}>{t.title}</Text>
                </Checkbox>
                {prog && (
                  <Text
                    type="secondary"
                    style={{ marginLeft: "auto", fontSize: 12 }}
                  >
                    {prog.done}/{prog.total}
                  </Text>
                )}
              </div>
              {prog && prog.total > 0 && (
                <Progress
                  percent={percent}
                  size="small"
                  showInfo={false}
                  style={{ marginTop: 6 }}
                />
              )}
              {linkedTasksByFeature?.[t.id]?.length ? (
                <List
                  size="small"
                  dataSource={linkedTasksByFeature[t.id]}
                  renderItem={(lt) => (
                    <List.Item style={{ paddingLeft: 24 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        - {lt.title} {lt.status === "done" ? "(완료)" : ""}
                      </Text>
                    </List.Item>
                  )}
                />
              ) : null}
            </List.Item>
          );
        }}
      />

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
    </Card>
  );
}
