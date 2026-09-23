import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Repository, Tables } from './repository'
import type { CollectionName, Settings } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

const mapKeys = (obj: Record<string, unknown>, fn: (k: string) => string) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v]))

// numeric columns can arrive as strings; coerce the ones the app does math on
const NUMERIC = new Set(['amount', 'budget', 'cost', 'order', 'estimate', 'monthlyBudget'])
const fromRow = (row: Record<string, unknown>) => {
  const { user_id: _userId, ...rest } = row
  const out = mapKeys(rest, camel)
  for (const k of Object.keys(out)) if (NUMERIC.has(k) && typeof out[k] === 'string') out[k] = Number(out[k])
  return out
}

const TABLES: CollectionName[] = ['tasks', 'projects', 'apps', 'expenses', 'habits', 'reflections']
const PAGE = 1000

export function createSupabaseRepository(client: SupabaseClient, onError: (message: string) => void): Repository {
  const fail = (action: string, error: { message: string }) => {
    console.error(`[supabase] ${action}`, error)
    onError(`Couldn't save changes (${action}). Check your connection and try again.`)
  }

  async function selectAll(table: string) {
    const rows: Record<string, unknown>[] = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await client.from(table).select('*').range(from, from + PAGE - 1)
      if (error) throw error
      rows.push(...(data ?? []))
      if (!data || data.length < PAGE) return rows
    }
  }

  return {
    kind: 'supabase',
    async loadAll() {
      const results = await Promise.all(TABLES.map(selectAll))
      return Object.fromEntries(TABLES.map((t, i) => [t, results[i].map(fromRow)])) as unknown as Tables
    },
    async upsert(collection, row) {
      const { error } = await client.from(collection).upsert(mapKeys(row as unknown as Record<string, unknown>, snake))
      if (error) fail(`update ${collection}`, error)
    },
    async remove(collection, id) {
      const { error } = await client.from(collection).delete().eq('id', id)
      if (error) fail(`delete from ${collection}`, error)
    },
    async loadSettings() {
      const { data, error } = await client.from('settings').select('*').maybeSingle()
      if (error) throw error
      return data ? (fromRow(data) as unknown as Settings) : null
    },
    async saveSettings(settings) {
      const { error } = await client.from('settings').upsert(mapKeys(settings as unknown as Record<string, unknown>, snake))
      if (error) fail('update settings', error)
    },
  }
}
