import type { User } from '@supabase/supabase-js'
import { CheckSquare, Loader2, Mail } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Button, Input } from '@/components/ui'
import { localRepository, type Repository } from '@/data/repository'
import { createSupabaseRepository, supabase } from '@/data/supabase'
import { emptyTables, setRepository, useData } from '@/store/data'
import { useUI } from '@/store/ui'

/** First name from the Google profile, used to greet a brand-new account. */
const firstName = (user: User) => String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '').split(' ')[0]

async function loadAccount(repo: Repository, user: User) {
  const [tables, settings] = await Promise.all([repo.loadAll(), repo.loadSettings()])
  const state = useData.getState()
  state.hydrate(tables ?? emptyTables, settings ?? { name: firstName(user) })
  if (!settings) void repo.saveSettings(useData.getState().settings)
}

/**
 * Local mode (no Supabase env vars): renders the app directly on localStorage.
 * Cloud mode: requires sign-in, then loads and syncs the account's data.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(supabase ? undefined : null)
  const [loadedAccount, setLoadedAccount] = useState<string | null>(null)
  // Changes only when the signed-in account changes, not on token refreshes.
  const account = user === undefined ? 'loading' : (user?.id ?? 'signed-out')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || user === undefined) return
    if (!user) {
      // Signed out: forget the previous account's cached data on this device.
      setRepository(localRepository)
      useData.getState().hydrate(emptyTables)
      return
    }
    const repo = createSupabaseRepository(supabase, (msg) => useUI.getState().setSyncError(msg))
    let cancelled = false
    loadAccount(repo, user)
      .catch((err) => {
        console.error('[supabase] load failed', err)
        useUI.getState().setSyncError("Couldn't load your data. Refresh to try again.")
      })
      .finally(() => {
        if (cancelled) return
        setRepository(repo)
        setLoadedAccount(user.id)
      })

    // Pick up changes made on other devices when coming back to the tab.
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadAccount(repo, user).catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [account]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!supabase) return <>{children}</>
  if (user === undefined || (user && loadedAccount !== user.id)) {
    return (
      <div className="grid h-full place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    )
  }
  if (!user) return <SignIn />
  return <>{children}</>
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle')
  const redirectTo = window.location.origin

  const google = async () => {
    setState('busy')
    const { error } = await supabase!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
    if (error) setState('error')
  }

  const magicLink = async (e: FormEvent) => {
    e.preventDefault()
    setState('busy')
    const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    setState(error ? 'error' : 'sent')
  }

  return (
    <div className="relative grid h-full place-items-center overflow-hidden px-4">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="card relative w-full max-w-sm p-8 shadow-2xl">
        <div className="bg-brand mb-5 grid h-11 w-11 place-items-center rounded-2xl shadow-lg shadow-violet-500/30">
          <CheckSquare className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-bold">Welcome to Elvis Tracker</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Sign in to sync your tasks, apps and budget across devices.</p>

        <Button variant="secondary" className="h-11 w-full bg-white text-[#1f1f1f] hover:border-line hover:bg-white/90" onClick={google} disabled={state === 'busy'}>
          {state === 'busy' && !showEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </Button>

        {state === 'sent' ? (
          <div className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-500">
            Check <b>{email}</b> for your sign-in link.
          </div>
        ) : showEmail ? (
          <form onSubmit={magicLink} className="mt-4 flex flex-col gap-2">
            <Input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Button type="submit" variant="primary" disabled={state === 'busy'}>
              {state === 'busy' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Email me a sign-in link
            </Button>
          </form>
        ) : (
          <button onClick={() => setShowEmail(true)} className="mt-4 w-full cursor-pointer text-center text-xs text-muted hover:text-fg">
            or use an email link instead
          </button>
        )}
        {state === 'error' && <p className="mt-3 text-sm text-red-500">Sign-in didn't work. Please try again.</p>}
      </div>
    </div>
  )
}
