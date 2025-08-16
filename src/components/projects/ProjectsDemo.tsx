import { useState } from "react";
import { useCreateProject, useProjects } from "../../hooks/useProjects";

export function ProjectsDemo() {
  const { data, isLoading, isError, error } = useProjects();
  const { mutateAsync: create, isPending } = useCreateProject();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await create({ name: name.trim(), description: desc.trim() || null });
    setName("");
    setDesc("");
  };

  return (
    <div>
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        <input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <input
          placeholder="Description (optional)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          style={{ flex: 2, padding: 8 }}
        />
        <button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create"}
        </button>
      </form>

      {isLoading && <div>Loading projects...</div>}
      {isError && (
        <div style={{ color: "crimson" }}>
          {(error as any)?.message ?? "Failed to load"}
        </div>
      )}

      <ul style={{ display: "grid", gap: 8, padding: 0, listStyle: "none" }}>
        {(data ?? []).map((p) => (
          <li
            key={p.id}
            style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
          >
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            {p.description && (
              <div style={{ color: "#666", marginTop: 4 }}>{p.description}</div>
            )}
            <div style={{ marginTop: 6, fontSize: 12, color: "#999" }}>
              Created: {new Date(p.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
