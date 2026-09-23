import { Cloud, Database, Download, Keyboard, RotateCcw, Trash2, Upload } from 'lucide-react'
import { useRef } from 'react'
import { Button, Field, Input, PageHeader, Select } from '@/components/ui'
import { supabase } from '@/data/supabase'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'INR', 'JPY']

export function SettingsPage() {
  const { settings, setSettings, resetDemo, clearAll, replaceAll } = useData()
  const setHelp = useUI((s) => s.setHelp)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportJson = () => {
    const { tasks, projects, apps, expenses, habits, reflections, settings } = useData.getState()
    const blob = new Blob([JSON.stringify({ tasks, projects, apps, expenses, habits, reflections, settings }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `elvis-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      replaceAll({
        tasks: data.tasks ?? [],
        projects: data.projects ?? [],
        apps: data.apps ?? [],
        expenses: data.expenses ?? [],
        habits: data.habits ?? [],
        reflections: data.reflections ?? [],
      })
      if (data.settings) setSettings(data.settings)
      alert('Backup restored.')
    } catch {
      alert("That file doesn't look like an Elvis Tracker backup.")
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Make it yours." />
      <div className="grid max-w-3xl gap-5">
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">Profile & money</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Your name">
              <Input defaultValue={settings.name} onBlur={(e) => setSettings({ name: e.target.value })} />
            </Field>
            <Field label="Currency">
              <Select value={settings.currency} onChange={(e) => setSettings({ currency: e.target.value })}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Monthly budget">
              <Input type="number" min="0" defaultValue={settings.monthlyBudget} onBlur={(e) => setSettings({ monthlyBudget: parseFloat(e.target.value) || 0 })} />
            </Field>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
            {supabase ? <Cloud className="h-4 w-4 text-emerald-500" /> : <Database className="h-4 w-4 text-muted" />}
            Storage: {supabase ? 'Supabase cloud sync' : 'This browser'}
          </h2>
          <p className="mb-4 text-sm text-muted">
            {supabase
              ? 'Your data syncs to Supabase and is available on every device you sign in on.'
              : 'Data is saved in this browser. Add Supabase keys to sync across devices (see README).'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportJson}>
              <Download className="h-4 w-4" /> Export backup
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import backup
            </Button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
            {supabase && (
              <Button variant="ghost" onClick={() => supabase!.auth.signOut()}>
                Sign out
              </Button>
            )}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">Keyboard</h2>
          <Button onClick={() => setHelp(true)}>
            <Keyboard className="h-4 w-4" /> Show shortcuts
          </Button>
        </section>

        <section className="card border-red-500/30 p-5">
          <h2 className="mb-1 text-sm font-semibold">Danger zone</h2>
          <p className="mb-4 text-sm text-muted">Start fresh when you're ready to track real work.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => confirm('Replace everything with demo data?') && resetDemo()}>
              <RotateCcw className="h-4 w-4" /> Load demo data
            </Button>
            <Button variant="danger" onClick={() => confirm('Delete all tasks, projects, apps, expenses and habits? This cannot be undone.') && clearAll()}>
              <Trash2 className="h-4 w-4" /> Clear all data
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}
