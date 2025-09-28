import { useAcceptInvite } from "@/hooks/useInvites";
import { supabase } from "@/lib/supabaseClient";
import { Button, Result, Spin, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function InviteAcceptPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { mutateAsync: accept } = useAcceptInvite();
  const [error, setError] = useState<string | null>(null);

  const loggedIn = useMemo(() => {
    // SessionGate 보장을 받지만, 이메일 없는 익명 계정일 수도 있어 체크
    return supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      return Boolean(u && !(u as any).is_anonymous);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!token) {
          setError("토큰이 없어");
          return;
        }
        const isAuthed = await loggedIn;
        if (!isAuthed) {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: window.location.href,
            },
          });
          if (error) throw error;
          return;
        }
        const projectId = await accept(token);
        message.success("초대를 수락했어");
        navigate(`/projects/${projectId}`, { replace: true });
      } catch (e: any) {
        setError(e?.message ?? "초대 수락 실패");
      }
    })();
  }, [token]);

  if (!token) {
    return <Result status="warning" title="유효하지 않은 초대 링크야" />;
  }

  if (error) {
    return (
      <Result
        status="error"
        title="초대 수락에 실패했어"
        subTitle={error}
        extra={
          <Button
            type="primary"
            onClick={() => navigate("/", { replace: true })}
          >
            홈으로
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ display: "grid", placeItems: "center", height: "60vh" }}>
      <Spin tip="초대 확인 중..." />
    </div>
  );
}

export default InviteAcceptPage;
