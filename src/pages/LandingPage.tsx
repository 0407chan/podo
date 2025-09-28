import { supabase } from "@/lib/supabaseClient";
import { Button, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function LandingPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session && !data.session.user.is_anonymous) {
        nav("/projects", { replace: true });
      }
    })();
  }, [nav]);

  const handleStart = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", maxWidth: 560, padding: 24 }}>
        <Typography.Title level={2} style={{ marginBottom: 12 }}>
          Podo
        </Typography.Title>
        <Typography.Paragraph style={{ color: "#6b7280", marginBottom: 24 }}>
          하루의 할 일과 기능 진행을 한 눈에 관리하는 개인 생산성 도구
        </Typography.Paragraph>
        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={() => void handleStart()}
        >
          Google로 시작하기
        </Button>
      </div>
    </div>
  );
}

export default LandingPage;
