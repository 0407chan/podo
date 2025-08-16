import { Card, List, Typography } from "antd";
const { Text } = Typography;

type DailyListItem = {
  date: string; // YYYY-MM-DD
  contentSnippet: string;
};

type Props = {
  items: DailyListItem[]; // sorted desc by date
  onSelect: (date: string) => void;
};

export function DailyList({ items, onSelect }: Props) {
  return (
    <Card title="최근 Daily">
      <List
        dataSource={items}
        renderItem={(i) => (
          <List.Item
            onClick={() => onSelect(i.date)}
            style={{ cursor: "pointer" }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{i.date}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {i.contentSnippet}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
}
