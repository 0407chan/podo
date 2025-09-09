import type { Project } from "@/api/projects";
import { supabase } from "@/lib/supabaseClient";
import {
  FolderOpenOutlined,
  LogoutOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Flex, Layout, Menu, message, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
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
  const qc = useQueryClient();
  const [authUser, setAuthUser] = useState<{
    id: string;
    isAnonymous: boolean;
    email?: string | null;
    avatar_url?: string | null;
  } | null>(null);
  // removed modal-based login choices; landing page handles login

  const selectedKeys = useMemo(() => {
    const m = pathname.match(/\/projects\/(.+)/);
    return m ? [m[1]] : [];
  }, [pathname]);

  const logoPublicUrl = (project: Project) => {
    if (!project.logo_url) return undefined;
    const { data } = supabase.storage
      .from("project-logos")
      .getPublicUrl(project.logo_url);
    return data.publicUrl;
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setAuthUser(
        data.user
          ? {
              id: data.user.id,
              isAnonymous: Boolean(
                (data.user as any).is_anonymous ??
                  (data.user.user_metadata as any)?.is_anonymous
              ),
              email: data.user.email,
              avatar_url: data.user.user_metadata.avatar_url,
            }
          : null
      );
    };
    void init();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setAuthUser(
        u
          ? {
              id: u.id,
              isAnonymous: Boolean(
                (u as any).is_anonymous ??
                  (u.user_metadata as any)?.is_anonymous
              ),
              email: u.email,
              avatar_url: u.user_metadata.avatar_url,
            }
          : null
      );
      if (event === "SIGNED_OUT") {
        qc.removeQueries({ queryKey: ["projects"] });
        qc.setQueryData(["projects"], []);
      }
    });
    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  // login flow handled on LandingPage

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      message.success("로그아웃 완료");
      // clear cached project list
      qc.setQueryData(["projects"], []);
      qc.invalidateQueries({ queryKey: ["projects"] });
      // SessionGate가 자동으로 익명 세션 재발급
    } catch (e: any) {
      message.error(e?.message ?? "로그아웃 실패");
    }
  };

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
      <div style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>
        <Flex align="center" gap={8}>
          <Avatar src={authUser?.avatar_url ?? undefined} size={28} />
          <Flex vertical gap={2}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Podo
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {authUser?.email ?? "로그인 필요"}
            </Typography.Text>
          </Flex>
          <div style={{ marginLeft: "auto" }}>
            {authUser && !authUser.isAnonymous ? (
              <Button
                icon={<LogoutOutlined />}
                size="small"
                onClick={() => void handleSignOut()}
              />
            ) : null}
          </div>
        </Flex>
      </div>

      <div className={styles.header}>Projects</div>
      <div
        style={{
          padding: "0 8px",
          overflowY: "auto",
          height: "calc(100vh - 32px - 64px)",
        }}
      >
        <Menu
          mode="inline"
          selectable
          selectedKeys={selectedKeys}
          items={(authUser ? data ?? [] : []).map((p) => ({
            key: p.id,
            icon: p.logo_url ? (
              <img
                src={logoPublicUrl(p)}
                alt="logo"
                style={{ width: 16, height: 16 }}
              />
            ) : (
              <FolderOpenOutlined />
            ),
            label: (
              <NavLink to={`/projects/${p.id}`} style={{ color: "inherit" }}>
                {p.name}
              </NavLink>
            ),
          }))}
        />
        {authUser && isLoading && <div style={{ padding: 8 }}>Loading...</div>}
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
