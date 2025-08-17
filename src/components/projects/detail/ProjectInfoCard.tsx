import { Card, Descriptions, Tag, Typography } from "antd";
import type { Project } from "../../../api/projects";
const { Title, Text } = Typography;

type Props = {
  project: Project;
};

export function ProjectInfoCard({ project }: Props) {
  return (
    <Card
      style={{ height: "100%" }}
      styles={{
        body: {
          height: "100%",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {project.name}
        </Title>
        {project.status && <Tag>{project.status}</Tag>}
      </div>
      {project.description && (
        <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
          {project.description}
        </Text>
      )}
      <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
        <Descriptions.Item label="기간">
          {project.start_date ? project.start_date : "-"} ~{" "}
          {project.due_date ? project.due_date : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="ID">{project.id}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
