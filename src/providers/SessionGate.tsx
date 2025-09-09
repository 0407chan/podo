import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await supabase.auth.getSession();
      } catch (e: any) {
        setError(e?.message ?? "Failed to init session");
      } finally {
        if (mounted) setReady(true);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (!mounted) return;
      setReady(true);
    });
    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  if (error) return <div style={{ color: "crimson" }}>Auth error: {error}</div>;
  if (!ready) return <div>Initializing session...</div>;
  return <>{children}</>;
}
