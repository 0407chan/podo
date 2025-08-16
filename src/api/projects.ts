import { supabase } from "../lib/supabaseClient";

export type Project = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createProject(payload: {
  name: string;
  description?: string | null;
  start_date?: string | null;
  due_date?: string | null;
}): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      start_date: payload.start_date ?? null,
      due_date: payload.due_date ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Project;
}
