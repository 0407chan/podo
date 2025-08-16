import { PropsWithChildren } from 'react'
import { Sidebar } from '../components/sidebar/Sidebar'

export function MainLayout({ children }: PropsWithChildren) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: 24 }}>{children}</main>
        </div>
    )
}


