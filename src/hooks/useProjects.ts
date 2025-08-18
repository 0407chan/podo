import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  listProjects,
  type Project,
  updateProject,
} from "../api/projects";

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

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: ["projects"] });
      const previous = qc.getQueryData<Project[]>(["projects"]);
      if (previous) {
        const next = previous.map((p) =>
          p.id === variables.id
            ? {
                ...p,
                ...(typeof variables.name !== "undefined"
                  ? { name: variables.name }
                  : {}),
                ...(typeof variables.start_date !== "undefined"
                  ? { start_date: variables.start_date }
                  : {}),
                ...(typeof variables.due_date !== "undefined"
                  ? { due_date: variables.due_date }
                  : {}),
                ...(typeof (variables as any).logo_url !== "undefined"
                  ? { logo_url: (variables as any).logo_url }
                  : {}),
              }
            : p
        );
        qc.setQueryData(["projects"], next);
      }
      return { previous } as { previous?: Project[] };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) qc.setQueryData(["projects"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
