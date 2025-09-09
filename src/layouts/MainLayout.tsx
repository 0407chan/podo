import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/sidebar/Sidebar";
import { supabase } from "../lib/supabaseClient";

export function MainLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      if (!mounted) return;
      if (!user || (user as any).is_anonymous) navigate("/", { replace: true });
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const user = session?.user ?? null;
      if (!user || (user as any).is_anonymous) navigate("/", { replace: true });
    });
    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, [navigate]);
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
