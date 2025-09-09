import { supabase } from "@/lib/supabaseClient";
import { useMutation } from "@tanstack/react-query";

export function useCreateInvite() {
  return useMutation({
    mutationFn: async (payload: {
      projectId: string;
      email: string;
      role: "viewer" | "editor";
    }) => {
      const { data, error } = await supabase.rpc("create_invite", {
        p_project_id: payload.projectId,
        p_email: payload.email,
        p_role: payload.role,
      });
      if (error) throw error;
      const token = data as string;
      const origin = window.location.origin;
      const url = `${origin}/invite?token=${encodeURIComponent(token)}`;
      return url;
    },
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc("accept_invite", {
        p_token: token,
      });
      if (error) throw error;
      return data as string; // project_id
    },
  });
}
