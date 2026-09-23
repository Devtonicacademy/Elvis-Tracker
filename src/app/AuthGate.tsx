import type { Session } from '@supabase/supabase-js'
import { CheckSquare, Loader2, Mail } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Button, Input } from '@/components/ui'
import { createSupabaseRepository, supabase } from '@/data/supabase'
import type { CollectionName } from '@/data/types'
import { setRepository, useData } from '@/store/data'

/**
 * Local mode (no Supabase env vars): renders the app directly on localStorage.
 * Cloud mode: requires a magic-link sign-in, then syncs with Supabase.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null)
  const [ready, setReady] = useState(!supabase)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    const repo = createSupabaseRepository(supabase)
    repo
      .loadAll()
      .then(async (remote) => {
        if (!remote) return
        const isEmpty = Object.values(remote).every((rows) => rows.length === 0)
        const state = useData.getState()
        if (isEmpty) {
          // First sign-in: move whatever is stored locally into the cloud.
          const collections: CollectionName[] = ['projects', 'tasks', 'apps', 'expenses', 'habits', 'reflections']
          for (const c of collections) for (const row of state[c]) await repo.upsert(c, row as never)
        } else state.replaceAll(remote)
      })
      .catch((err) => console.error('[supabase] load failed', err))
      .finally(() => {
        setRepository(repo)
        setReady(true)
      })
  }, [session])

  if (!supabase) return <>{children}</>
  if (session === undefined || (session && !ready)) {
    return (
      <div className="grid h-full place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    )
  }
  if (!session) return <SignIn />
  return <>{children}</>
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setState('sending')
    const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setState(error ? 'error' : 'sent')
  }

  return (
    <div className="relative grid h-full place-items-center overflow-hidden px-4">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
      <form onSubmit={submit} className="card relative w-full max-w-sm p-8 shadow-2xl">
        <div className="bg-brand mb-5 grid h-11 w-11 place-items-center rounded-2xl shadow-lg shadow-violet-500/30">
          <CheckSquare className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-bold">Welcome to Elvis Tracker</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Sign in with a magic link. No password needed.</p>
        {state === 'sent' ? (
          <div className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-500">
            Check <b>{email}</b> for your sign-in link.
          </div>
        ) : (
          <>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Button type="submit" variant="primary" className="mt-3 w-full" disabled={state === 'sending'}>
              {state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send magic link
            </Button>
            {state === 'error' && <p className="mt-3 text-sm text-red-500">Couldn't send the link. Try again.</p>}
          </>
        )}
      </form>
    </div>
  )
}
