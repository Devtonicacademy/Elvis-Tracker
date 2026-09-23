import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Repository } from './repository'
import type { CollectionName } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

const mapKeys = (obj: Record<string, unknown>, fn: (k: string) => string) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v]))

const TABLES: CollectionName[] = ['tasks', 'projects', 'apps', 'expenses', 'habits', 'reflections']

export function createSupabaseRepository(client: SupabaseClient): Repository {
  return {
    kind: 'supabase',
    async loadAll() {
      const results = await Promise.all(TABLES.map((t) => client.from(t).select('*')))
      const out: Record<string, unknown[]> = {}
      results.forEach((res, i) => {
        if (res.error) throw res.error
        out[TABLES[i]] = (res.data ?? []).map((row) => {
          const { user_id: _userId, ...rest } = row as Record<string, unknown>
          return mapKeys(rest, camel)
        })
      })
      return out as never
    },
    async upsert(collection, row) {
      const { error } = await client
        .from(collection)
        .upsert(mapKeys(row as unknown as Record<string, unknown>, snake))
      if (error) console.error(`[supabase] upsert ${collection}`, error)
    },
    async remove(collection, id) {
      const { error } = await client.from(collection).delete().eq('id', id)
      if (error) console.error(`[supabase] delete ${collection}`, error)
    },
  }
}
