import { Button, Card, Descriptions, Image, message, Typography } from "antd";
import { useState } from "react";
import type { Project } from "../../../api/projects";
import { useUpdateProject } from "../../../hooks/useProjects";
import { supabase } from "../../../lib/supabaseClient";
import ProjectFormModal from "../ProjectFormModal";
const { Title, Text } = Typography;

type Props = {
  project: Project;
};

export function ProjectInfoCard({ project }: Props) {
  const [open, setOpen] = useState(false);
  const { mutateAsync: update, isPending } = useUpdateProject();
  const openModal = () => setOpen(true);

  const handleSelectAndUpload = async (file: File) => {
    try {
      // 1) 간단한 타입/사이즈 검사 (2MB 제한)
      if (!file.type.startsWith("image/")) {
        message.error("이미지 파일만 업로드할 수 있어");
        return false;
      }
      if (file.size > 2 * 1024 * 1024) {
        message.error("2MB 이하 이미지로 업로드해줘");
        return false;
      }

      // 2) 128x128 리사이즈 + webp 압축
      const resizedBlob = await resizeToWebp(file, 128, 128, 0.9);

      // 3) Storage 업로드
      const objectPath = `projects/${
        project.id
      }/${Date.now()}-${file.name.replace(/\s+/g, "_")}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("project-logos")
        .upload(objectPath, resizedBlob, {
          upsert: true,
          contentType: "image/webp",
        });
      if (uploadError) throw uploadError;

      // 4) DB 업데이트
      await update({ id: project.id, logo_url: objectPath });
      message.success("로고를 업데이트했어");
      return false;
    } catch (e: any) {
      message.error(e?.message ?? "업로드 실패");
      return false;
    }
  };

  const logoPublicUrl = (() => {
    if (!project.logo_url) return undefined;
    const { data } = supabase.storage
      .from("project-logos")
      .getPublicUrl(project.logo_url);
    return data.publicUrl;
  })();

  async function resizeToWebp(
    file: File,
    maxW: number,
    maxH: number,
    quality = 0.9
  ): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(maxW / bitmap.width, maxH / bitmap.height, 1);
    const w = Math.round(bitmap.width * ratio);
    const h = Math.round(bitmap.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("캔버스 생성 실패");
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("이미지 인코딩 실패"))),
        "image/webp",
        quality
      );
    });
    return blob;
  }

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
    </Card>
  );
}
