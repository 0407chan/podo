import { useCreateInvite } from "@/hooks/useInvites";
import {
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Space,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  projectId: string;
  onClose: () => void;
};

export default function ProjectInviteModal({
  open,
  projectId,
  onClose,
}: Props) {
  const [form] = Form.useForm<{ email: string; role: "viewer" | "editor" }>();
  const { mutateAsync: createInvite, isPending } = useCreateInvite();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setInviteUrl(null);
      form.resetFields();
    }
  }, [open]);

  const handleCreate = async () => {
    const { email, role } = await form.validateFields();
    const url = await createInvite({ projectId, email: email.trim(), role });
    setInviteUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      message.success("초대 링크를 복사했어");
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      title="멤버 초대"
      open={open}
      onCancel={onClose}
      onOk={inviteUrl ? onClose : handleCreate}
      okText={inviteUrl ? "닫기" : "초대 링크 생성"}
      confirmLoading={isPending}
      destroyOnClose
      transitionName=""
    >
      {!inviteUrl ? (
        <Form form={form} layout="vertical" initialValues={{ role: "viewer" }}>
          <Form.Item
            label="이메일"
            name="email"
            rules={[
              { required: true, message: "이메일을 입력해줘" },
              { type: "email", message: "올바른 이메일을 입력해줘" },
            ]}
          >
            <Input placeholder="example@gmail.com" autoFocus />
          </Form.Item>
          <Form.Item label="역할" name="role">
            <Radio.Group>
              <Radio value="viewer">Viewer(읽기)</Radio>
              <Radio value="editor">Editor(쓰기)</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            아래 링크를 공유해줘
          </Typography.Text>
          <Input value={inviteUrl} readOnly />
          <Space>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteUrl);
                  message.success("복사 완료");
                } catch {
                  message.warning("복사 권한이 없어. 수동으로 복사해줘");
                }
              }}
            >
              링크 복사
            </Button>
            <Button
              onClick={() => {
                setInviteUrl(null);
                form.resetFields();
              }}
            >
              새로 초대
            </Button>
          </Space>
        </Space>
      )}
    </Modal>
  );
}
