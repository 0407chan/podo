import { supabase } from "../lib/supabaseClient";

export type Project = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  due_date: string | null;
  logo_url: string | null;
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
  logo_url?: string | null;
}): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      start_date: payload.start_date ?? null,
      due_date: payload.due_date ?? null,
      logo_url: payload.logo_url ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(payload: {
  id: string;
  name?: string;
  start_date?: string | null;
  due_date?: string | null;
  logo_url?: string | null;
}): Promise<Project> {
  const updates: Record<string, any> = {};
  if (typeof payload.name !== "undefined") updates.name = payload.name;
  if (typeof payload.start_date !== "undefined")
    updates.start_date = payload.start_date;
  if (typeof payload.due_date !== "undefined")
    updates.due_date = payload.due_date;
  if (typeof payload.logo_url !== "undefined")
    updates.logo_url = payload.logo_url;

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", payload.id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Project;
}
