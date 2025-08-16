import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function SessionGate({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session) {
                        const { error } = await supabase.auth.signInAnonymously()
                        if (error) throw error
                    }
                    if (mounted) setReady(true)
                } catch (e: any) {
                    setError(e?.message ?? 'Failed to init session')
                }
            })()
        return () => { mounted = false }
    }, [])

    if (error) return <div style={{ color: 'crimson' }}>Auth error: {error}</div>
    if (!ready) return <div>Initializing session...</div>
    return <>{children}</>
}


