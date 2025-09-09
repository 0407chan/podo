import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

type Props = { children: React.ReactNode };

export function RequireAuth({ children }: Props) {
  // 세션 확인 전에는 리다이렉트하지 않도록 loading으로 시작
  const [status, setStatus] = useState<"loading" | "authed" | "unauth">(
    "loading"
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      if (!mounted) return;
      setStatus(user && !(user as any).is_anonymous ? "authed" : "unauth");
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      setStatus(user && !(user as any).is_anonymous ? "authed" : "unauth");
    });
    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") return null;
  if (status === "unauth") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default RequireAuth;
