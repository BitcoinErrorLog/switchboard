import { create } from 'zustand'
import type { PlatformId, SwitchboardObject } from '@/core/types'

interface ReaderState {
  items: SwitchboardObject[]
  cursors: Map<PlatformId, string | null>
  loading: boolean
  filter: PlatformId | 'all'
  hasMore: Map<PlatformId, boolean>

  addItems: (newItems: SwitchboardObject[]) => void
  setCursor: (platform: PlatformId, cursor: string | null) => void
  setHasMore: (platform: PlatformId, hasMore: boolean) => void
  setLoading: (loading: boolean) => void
  setFilter: (filter: PlatformId | 'all') => void
  reset: () => void
}

function deduplicateAndSort(items: SwitchboardObject[]): SwitchboardObject[] {
  const seen = new Set<string>()
  const unique: SwitchboardObject[] = []
  for (const item of items) {
    if (!seen.has(item.canonical_object_id)) {
      seen.add(item.canonical_object_id)
      unique.push(item)
    }
  }
  return unique.sort((a, b) => b.created_at - a.created_at)
}

export const useReaderStore = create<ReaderState>((set) => ({
  items: [],
  cursors: new Map(),
  loading: false,
  filter: 'all',
  hasMore: new Map(),

  addItems: (newItems) =>
    set((s) => ({
      items: deduplicateAndSort([...s.items, ...newItems]),
    })),

  setCursor: (platform, cursor) =>
    set((s) => {
      const next = new Map(s.cursors)
      next.set(platform, cursor)
      return { cursors: next }
    }),

  setHasMore: (platform, hasMore) =>
    set((s) => {
      const next = new Map(s.hasMore)
      next.set(platform, hasMore)
      return { hasMore: next }
    }),

  setLoading: (loading) => set({ loading }),
  setFilter: (filter) => set({ filter }),
  reset: () => set({ items: [], cursors: new Map(), loading: false, filter: 'all', hasMore: new Map() }),
}))
