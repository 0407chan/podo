import { useMyRole, useProjectMembers } from "@/hooks/useMembers";
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Image,
  message,
  Tooltip,
  Typography,
} from "antd";
import { useState } from "react";
import type { Project } from "../../../api/projects";
import { useUpdateProject } from "../../../hooks/useProjects";
import { supabase } from "../../../lib/supabaseClient";
import ProjectFormModal from "../ProjectFormModal";
import ProjectInviteModal from "../ProjectInviteModal";
const { Title, Text } = Typography;

type Props = {
  project: Project;
};

export function ProjectInfoCard({ project }: Props) {
  const [open, setOpen] = useState(false);
  const { mutateAsync: update, isPending } = useUpdateProject();
  const openModal = () => setOpen(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  // 파일 업로드는 `ProjectFormModal`에서 처리

  const logoPublicUrl = (() => {
    if (!project.logo_url) return undefined;
    const { data } = supabase.storage
      .from("project-logos")
      .getPublicUrl(project.logo_url);
    return data.publicUrl;
  })();

  // 로컬 업로드 유틸은 이 파일에선 사용하지 않아 제거

  return (
    <Card
      styles={{
        body: {
          padding: 16,
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
        {logoPublicUrl && (
          <Image
            width={36}
            height={36}
            src={logoPublicUrl}
            alt="logo"
            style={{ objectFit: "contain", minWidth: 36, minHeight: 36 }}
          />
        )}
        <Title level={4} style={{ margin: 0, width: "100%", marginLeft: 4 }}>
          {project.name}
        </Title>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* {project.status && <Tag>{project.status}</Tag>} */}
          <Button size="small" onClick={openModal}>
            편집
          </Button>
          {(() => {
            const { data: role } = useMyRole(project.id, project.owner_id);
            const isOwner = role === "owner";
            if (!isOwner) return null;
            return (
              <Button
                size="small"
                type="primary"
                onClick={() => setInviteOpen(true)}
              >
                초대
              </Button>
            );
          })()}
        </div>
      </div>
      {(() => {
        const { data: members = [] } = useProjectMembers(project.id);
        if (!members.length) return null;
        return (
          <div style={{ marginTop: 8 }}>
            <Avatar.Group maxCount={6} size="small">
              {members.map((m) => (
                <Tooltip
                  key={m.id}
                  title={
                    m.status === "invited"
                      ? `${m.invited_email} (초대 대기)`
                      : `${m.role}`
                  }
                >
                  <Avatar src={m.avatar_url ?? undefined}>
                    {m.status === "invited"
                      ? (m.invited_email ?? "?")?.charAt(0).toUpperCase()
                      : m.role.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
          </div>
        );
      })()}
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
        projectId={project.id}
        initial={{
          name: project.name,
          start_date: project.start_date,
          due_date: project.due_date,
          logo_url: project.logo_url ?? null,
        }}
        confirmLoading={isPending}
        onSubmit={async ({ name, start_date, due_date, logo_url }) => {
          await update({
            id: project.id,
            name,
            start_date,
            due_date,
            logo_url,
          });
          setOpen(false);
          message.success("프로젝트를 업데이트했어");
        }}
        onCancel={() => setOpen(false)}
      />
      <ProjectInviteModal
        open={inviteOpen}
        projectId={project.id}
        onClose={() => setInviteOpen(false)}
      />
    </Card>
  );
}
