import { DatePicker, Form, Input, Modal } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: {
    name?: string;
    start_date?: string | null;
    due_date?: string | null;
  };
  confirmLoading?: boolean;
  onSubmit: (values: {
    name: string;
    start_date: string | null;
    due_date: string | null;
  }) => Promise<void> | void;
  onCancel: () => void;
};

export function ProjectFormModal({
  open,
  mode,
  initial,
  confirmLoading,
  onSubmit,
  onCancel,
}: Props) {
  const [form] = Form.useForm<{
    name: string;
    range?: [dayjs.Dayjs, dayjs.Dayjs];
  }>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initial?.name ?? "",
        range:
          initial?.start_date && initial?.due_date
            ? [dayjs(initial.start_date), dayjs(initial.due_date)]
            : undefined,
      });
    }
  }, [open, initial?.name, initial?.start_date, initial?.due_date]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const [start, end] = values.range ?? [];
    if (start && end && end.isBefore(start, "day")) {
      throw new Error("기간이 올바르지 않아");
    }
    await onSubmit({
      name: values.name.trim(),
      start_date: start ? start.format("YYYY-MM-DD") : null,
      due_date: end ? end.format("YYYY-MM-DD") : null,
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
      destroyOnHidden
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
      </Form>
    </Modal>
  );
}

export default ProjectFormModal;
