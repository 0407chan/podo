import { useParams } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'

export function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { data } = useProjects()
    const project = (data ?? []).find((p) => p.id === id)

    if (!id) return <div>No project selected</div>
    if (!project) return <div>Loading project...</div>

    return (
        <div>
            <h2 style={{ marginBottom: 8 }}>{project.name}</h2>
            {project.description && <p style={{ color: '#6b7280' }}>{project.description}</p>}
            <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af' }}>Project ID: {project.id}</div>
        </div>
    )
}
