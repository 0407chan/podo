import { FolderOpenOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Layout, Menu, message } from "antd";
import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCreateProject, useProjects } from "../../hooks/useProjects";
import ProjectFormModal from "../projects/ProjectFormModal";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const { data, isLoading } = useProjects();
  const { mutateAsync: create, isPending } = useCreateProject();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const selectedKeys = useMemo(() => {
    const m = pathname.match(/\/projects\/(.+)/);
    return m ? [m[1]] : [];
  }, [pathname]);

  const onCreate = async (values: {
    name: string;
    start_date: string | null;
    due_date: string | null;
  }) => {
    const project = await create({
      name: values.name,
      description: null,
      start_date: values.start_date,
      due_date: values.due_date,
    });
    setOpen(false);
    if ((project as any)?.id) {
      navigate(`/projects/${(project as any).id}`);
      message.success("프로젝트를 생성했어");
    }
  };

  return (
    <Layout.Sider width={260} className={styles.sider} theme="light">
      <div className={styles.header}>Projects</div>

      <div
        style={{
          padding: "0 8px",
          overflowY: "auto",
          height: "calc(100vh - 190px)",
        }}
      >
        <Menu
          mode="inline"
          selectable
          selectedKeys={selectedKeys}
          items={(data ?? []).map((p) => ({
            key: p.id,
            icon: <FolderOpenOutlined />,
            label: (
              <NavLink to={`/projects/${p.id}`} style={{ color: "inherit" }}>
                {p.name}
              </NavLink>
            ),
          }))}
        />
        {isLoading && <div style={{ padding: 8 }}>Loading...</div>}
      </div>

      <div
        style={{
          padding: 12,
          borderTop: "1px solid #eee",
          display: "grid",
        }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          loading={isPending}
          onClick={() => setOpen(true)}
        >
          Add Project
        </Button>
      </div>
      <ProjectFormModal
        open={open}
        mode="create"
        confirmLoading={isPending}
        onSubmit={onCreate}
        onCancel={() => setOpen(false)}
      />
    </Layout.Sider>
  );
}
