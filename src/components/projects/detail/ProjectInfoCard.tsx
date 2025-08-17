import { Button, Card, Descriptions, message, Tag, Typography } from "antd";
import { useState } from "react";
import type { Project } from "../../../api/projects";
import { useUpdateProject } from "../../../hooks/useProjects";
import ProjectFormModal from "../ProjectFormModal";
const { Title, Text } = Typography;

type Props = {
  project: Project;
};

export function ProjectInfoCard({ project }: Props) {
  const [open, setOpen] = useState(false);
  const { mutateAsync: update, isPending } = useUpdateProject();
  const openModal = () => setOpen(true);

  return (
    <Card>
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {project.status && <Tag>{project.status}</Tag>}
          <Button size="small" onClick={openModal}>
            편집
          </Button>
        </div>
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
      </Descriptions>

      <ProjectFormModal
        open={open}
        mode="edit"
        initial={{
          name: project.name,
          start_date: project.start_date,
          due_date: project.due_date,
        }}
        confirmLoading={isPending}
        onSubmit={async ({ name, start_date, due_date }) => {
          await update({ id: project.id, name, start_date, due_date });
          setOpen(false);
          message.success("프로젝트를 업데이트했어");
        }}
        onCancel={() => setOpen(false)}
      />
    </Card>
  );
}
