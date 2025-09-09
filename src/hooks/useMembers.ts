import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string | null;
  role: "viewer" | "editor";
  status: "invited" | "accepted";
  invited_email: string | null;
  invited_by: string;
  avatar_url?: string | null;
  created_at: string;
};

export function useProjectMembers(projectId: string | undefined) {
  return useQuery<ProjectMember[]>({
    queryKey: ["project-members", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select(
          "id, project_id, user_id, role, status, invited_email, invited_by, avatar_url, created_at"
        )
        .eq("project_id", projectId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProjectMember[];
    },
    staleTime: 10_000,
  });
}

export type MyRole = "owner" | "editor" | "viewer" | null;

export function useMyRole(
  projectId: string | undefined,
  ownerId: string | undefined
) {
  return useQuery<MyRole>({
    queryKey: ["my-role", projectId, ownerId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      if (!uid) return null;
      if (ownerId && uid === ownerId) return "owner";

      const { data, error } = await supabase
        .from("project_members")
        .select("role, status")
        .eq("project_id", projectId!)
        .eq("user_id", uid)
        .single();
      if (error && error.code !== "PGRST116") throw error; // no rows
      if (!data || data.status !== "accepted") return null;
      return data.role as "viewer" | "editor";
    },
    staleTime: 10_000,
  });
}
