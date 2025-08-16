import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProject, listProjects, type Project } from "../api/projects";

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: listProjects,
    staleTime: 10_000,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
