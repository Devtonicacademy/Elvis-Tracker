import type { CollectionName, Collections, Settings } from './types'

export type Tables = { [K in CollectionName]: Collections[K][] }

/**
 * Persistence backend. The store applies every change locally first and then
 * mirrors it here, so swapping localStorage for Supabase is a one-line change.
 */
export interface Repository {
  readonly kind: 'local' | 'supabase'
  loadAll(): Promise<Tables | null>
  upsert<K extends CollectionName>(collection: K, row: Collections[K]): Promise<void>
  remove(collection: CollectionName, id: string): Promise<void>
  loadSettings(): Promise<Settings | null>
  saveSettings(settings: Settings): Promise<void>
}

/** Local mode: the Zustand persist middleware already writes to localStorage. */
export const localRepository: Repository = {
  kind: 'local',
  loadAll: async () => null,
  upsert: async () => {},
  remove: async () => {},
  loadSettings: async () => null,
  saveSettings: async () => {},
}
