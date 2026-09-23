import type { CollectionName, Collections } from './types'

/**
 * Persistence backend. The store applies every change locally first and then
 * mirrors it here, so swapping localStorage for Supabase is a one-line change.
 */
export interface Repository {
  readonly kind: 'local' | 'supabase'
  loadAll(): Promise<{ [K in CollectionName]: Collections[K][] } | null>
  upsert<K extends CollectionName>(collection: K, row: Collections[K]): Promise<void>
  remove(collection: CollectionName, id: string): Promise<void>
}

/** Local mode: the Zustand persist middleware already writes to localStorage. */
export const localRepository: Repository = {
  kind: 'local',
  loadAll: async () => null,
  upsert: async () => {},
  remove: async () => {},
}
