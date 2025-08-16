import { Button, Card, Input, Segmented, Typography } from "antd";
import { useEffect, useState } from "react";
import styles from "./ProjectDetail.module.css";
const { Text } = Typography;

export type Daily = {
  id: string;
  project_id: string;
  date: string; // YYYY-MM-DD
  content: string;
};

type Props = {
  dates: string[]; // sorted desc
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  content: string;
  onChangeContent: (value: string) => void;
  onSave: () => void;
  onCreateToday: () => void;
};

export function DailyEditor({
  dates,
  selectedDate,
  onSelectDate,
  content,
  onChangeContent,
  onSave,
  onCreateToday,
}: Props) {
  const [local, setLocal] = useState(content);

  useEffect(() => {
    setLocal(content);
  }, [content]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== content) onChangeContent(local);
    }, 300);
    return () => clearTimeout(t);
  }, [local, content, onChangeContent]);

  return (
    <Card
      title="Daily"
      extra={<Button onClick={onCreateToday}>오늘 일지 만들기</Button>}
    >
      <Segmented
        options={dates}
        value={selectedDate ?? undefined}
        onChange={(val) => onSelectDate(String(val))}
        style={{ marginBottom: 8, maxWidth: "100%" }}
      />

      {selectedDate ? (
        <>
          <Input.TextArea
            placeholder="일지를 자유롭게 작성해줘 (나중에 TipTap으로 고도화)"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            autoSize={{ minRows: 8 }}
          />
          <div className={styles.actionsRow}>
            <Button type="primary" onClick={onSave}>
              저장
            </Button>
          </div>
        </>
      ) : (
        <Text type="secondary">날짜를 선택해줘</Text>
      )}
    </Card>
  );
}
