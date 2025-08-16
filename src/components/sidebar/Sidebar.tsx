import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useCreateProject, useProjects } from '../../hooks/useProjects'
import { Layout, Menu, Button, Input } from 'antd'
import { PlusOutlined, FolderOpenOutlined } from '@ant-design/icons'
import styles from './Sidebar.module.css'

export function Sidebar() {
    const { data, isLoading } = useProjects()
    const { mutateAsync: create, isPending } = useCreateProject()
    const [name, setName] = useState('')
    const [desc, setDesc] = useState('')
    const navigate = useNavigate()
    const { pathname } = useLocation()

    const selectedKeys = useMemo(() => {
        const m = pathname.match(/\/projects\/(.+)/)
        return m ? [m[1]] : []
    }, [pathname])

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        const project = await create({ name: name.trim(), description: desc.trim() || null })
        setName('')
        setDesc('')
        if ((project as any)?.id) navigate(`/projects/${(project as any).id}`)
    }

    return (
        <Layout.Sider width={260} className={styles.sider} theme="light">
            <div className={styles.header}>Projects</div>

            <div style={{ padding: '0 8px', overflowY: 'auto', height: 'calc(100vh - 190px)' }}>
                <Menu
                    mode="inline"
                    selectable
                    selectedKeys={selectedKeys}
                    items={(data ?? []).map((p) => ({
                        key: p.id,
                        icon: <FolderOpenOutlined />,
                        label: (
                            <NavLink to={`/projects/${p.id}`} style={{ color: 'inherit' }}>
                                {p.name}
                            </NavLink>
                        ),
                    }))}
                />
                {isLoading && <div style={{ padding: 8 }}>Loading...</div>}
            </div>

            <form onSubmit={onCreate} style={{ padding: 12, borderTop: '1px solid #eee', display: 'grid', gap: 6 }}>
                <Input
                    placeholder="New project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    placeholder="Description (optional)"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                />
                <Button htmlType="submit" type="primary" icon={<PlusOutlined />} loading={isPending}>
                    Add Project
                </Button>
            </form>
        </Layout.Sider>
    )
}


