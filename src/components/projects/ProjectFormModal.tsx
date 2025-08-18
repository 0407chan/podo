import { supabase } from "@/lib/supabaseClient";
import { PlusOutlined } from "@ant-design/icons";
import { DatePicker, Form, Input, Modal, Upload, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  projectId?: string; // edit 모드에서 업로드 경로 생성에 사용
  initial?: {
    name?: string;
    start_date?: string | null;
    due_date?: string | null;
    logo_url?: string | null;
  };
  confirmLoading?: boolean;
  onSubmit: (values: {
    name: string;
    start_date: string | null;
    due_date: string | null;
    logo_url?: string | null;
  }) => Promise<void> | void;
  onCancel: () => void;
};

export function ProjectFormModal({
  open,
  mode,
  projectId,
  initial,
  confirmLoading,
  onSubmit,
  onCancel,
}: Props) {
  const [form] = Form.useForm<{
    name: string;
    range?: [dayjs.Dayjs, dayjs.Dayjs];
    logo_url?: string | null;
  }>();
  const [logoErrored, setLogoErrored] = useState(false);
  const logoUrlWatch = Form.useWatch("logo_url", form);

  useEffect(() => {
    setLogoErrored(false);
  }, [logoUrlWatch]);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initial?.name ?? "",
        range:
          initial?.start_date && initial?.due_date
            ? [dayjs(initial.start_date), dayjs(initial.due_date)]
            : undefined,
        logo_url: initial?.logo_url ?? "",
      });
    }
  }, [
    open,
    initial?.name,
    initial?.start_date,
    initial?.due_date,
    initial?.logo_url,
  ]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const [start, end] = values.range ?? [];
    if (start && end && end.isBefore(start, "day")) {
      throw new Error("기간이 올바르지 않아");
    }

    console.log(values);
    await onSubmit({
      name: values.name.trim(),
      start_date: start ? start.format("YYYY-MM-DD") : null,
      due_date: end ? end.format("YYYY-MM-DD") : null,
      logo_url: values.logo_url ?? null,
    });
  };

  return (
    <Modal
      title={mode === "create" ? "프로젝트 생성" : "프로젝트 편집"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      transitionName=""
      confirmLoading={confirmLoading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="제목"
          name="name"
          rules={[
            { required: true, message: "제목을 입력해줘" },
            {
              validator: (_, v) =>
                !v || v.trim()
                  ? Promise.resolve()
                  : Promise.reject(new Error("공백만 입력은 안 돼")),
            },
            { max: 100, message: "제목은 100자 이내" },
          ]}
        >
          <Input placeholder="프로젝트 제목" allowClear />
        </Form.Item>
        <Form.Item label="기간" name="range">
          <DatePicker.RangePicker allowEmpty={[true, true]} />
        </Form.Item>
        <Form.Item label="로고">
          {(() => {
            const current = form.getFieldValue("logo_url") as string | null;
            const publicUrl = current
              ? supabase.storage.from("project-logos").getPublicUrl(current)
                  .data.publicUrl
              : undefined;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  // showUploadList={false}
                  fileList={
                    publicUrl
                      ? [{ uid: "-1", name: "logo", url: publicUrl }]
                      : []
                  }
                  onChange={(info) => {
                    if (info.file.status === "done") {
                      form.setFieldsValue({
                        logo_url: info.file.response.path,
                      });
                    }
                    if (info.file.status === "removed") {
                      form.setFieldsValue({ logo_url: undefined });
                    }
                  }}
                  maxCount={1}
                  beforeUpload={async (file) => {
                    try {
                      if (!file.type.startsWith("image/")) {
                        message.error("이미지 파일만 업로드 가능해");
                        return false;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        message.error("2MB 이하로 업로드해줘");
                        return false;
                      }
                      if (!supabase || !projectId) {
                        message.error("업로드 준비가 안 됐어");
                        return false;
                      }
                      const blob = await resizeToWebp(file, 128, 128, 0.9);
                      const objectPath = `projects/${projectId}/${Date.now()}-${file.name.replace(
                        /\s+/g,
                        "_"
                      )}.webp`;
                      const { error } = await supabase.storage
                        .from("project-logos")
                        .upload(objectPath, blob, {
                          upsert: true,
                          contentType: "image/webp",
                        });
                      if (error) throw error;
                      form.setFieldsValue({ logo_url: objectPath });
                      message.success("로고 업로드 완료");
                    } catch (e: any) {
                      message.error(e?.message ?? "업로드 실패");
                    }
                    return false;
                  }}
                >
                  <button
                    style={{ border: 0, background: "none" }}
                    type="button"
                  >
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </button>
                </Upload>
              </div>
            );
          })()}
          <Form.Item name="logo_url" hidden>
            <Input hidden />
          </Form.Item>
        </Form.Item>
      </Form>
    </Modal>
  );
}

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

export default ProjectFormModal;
