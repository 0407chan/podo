import { Button, Card, Checkbox, Input, List, Typography } from "antd";
import { useMemo, useState } from "react";
import type { FeatureTodo } from "./FeatureTodoList";
const { Text } = Typography;

type Props = {
  allTodos: FeatureTodo[];
  linkedTodoIds: string[];
  onToggleStatus: (todoId: string) => void;
  onLink: (todoId: string) => void;
  onUnlink: (todoId: string) => void;
};

export function LinkedTodosPanel({
  allTodos,
  linkedTodoIds,
  onToggleStatus,
  onLink,
  onUnlink,
}: Props) {
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const linked = useMemo(
    () => allTodos.filter((t) => linkedTodoIds.includes(t.id)),
    [allTodos, linkedTodoIds]
  );
  const candidates = useMemo(() => {
    const notLinked = allTodos.filter((t) => !linkedTodoIds.includes(t.id));
    const q = query.trim().toLowerCase();
    if (!q) return notLinked;
    return notLinked.filter((t) => t.title.toLowerCase().includes(q));
  }, [allTodos, linkedTodoIds, query]);

  return (
    <Card
      title="연결된 TODO"
      extra={
        <Button onClick={() => setPickerOpen((v) => !v)}>
          {isPickerOpen ? "닫기" : "연결 추가"}
        </Button>
      }
    >
      <List
        dataSource={linked}
        locale={{ emptyText: <Text type="secondary">연결된 항목이 없어</Text> }}
        renderItem={(t) => (
          <List.Item
            actions={[<Button onClick={() => onUnlink(t.id)}>해제</Button>]}
          >
            <Checkbox
              checked={t.status === "done"}
              onChange={() => onToggleStatus(t.id)}
            >
              <Text delete={t.status === "done"}>{t.title}</Text>
            </Checkbox>
          </List.Item>
        )}
      />

      {isPickerOpen && (
        <div style={{ marginTop: 8 }}>
          <Input.Search
            placeholder="검색으로 빠르게 찾아줘"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <List
            dataSource={candidates}
            locale={{
              emptyText: <Text type="secondary">추가 가능한 항목이 없어</Text>,
            }}
            renderItem={(t) => (
              <List.Item>
                <Button type="text" onClick={() => onLink(t.id)}>
                  {t.title}
                </Button>
              </List.Item>
            )}
          />
        </div>
      )}
    </Card>
  );
}
