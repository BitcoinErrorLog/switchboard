import { create } from 'zustand'
import type { PlatformId } from '@/core/types'

export type PublishStatus = 'idle' | 'publishing' | 'success' | 'error'

interface ComposerState {
  content: string
  targets: Set<PlatformId>
  status: Map<PlatformId, PublishStatus>
  errors: Map<PlatformId, string>
  results: Map<PlatformId, { external_id: string | null; url: string | null }>

  setContent: (content: string) => void
  toggleTarget: (platform: PlatformId) => void
  setTargets: (targets: Set<PlatformId>) => void
  setStatus: (platform: PlatformId, status: PublishStatus) => void
  setError: (platform: PlatformId, error: string) => void
  setResult: (platform: PlatformId, result: { external_id: string | null; url: string | null }) => void
  reset: () => void
}

export const PLATFORM_CHAR_LIMITS: Partial<Record<PlatformId, number>> = {
  bluesky: 300,
  nostr: 10000,
}

export const PUBKY_SHORT_LIMIT = 2000

export const useComposerStore = create<ComposerState>((set) => ({
  content: '',
  targets: new Set<PlatformId>(),
  status: new Map(),
  errors: new Map(),
  results: new Map(),

  setContent: (content) => set({ content }),

  toggleTarget: (platform) =>
    set((s) => {
      const next = new Set(s.targets)
      if (next.has(platform)) next.delete(platform)
      else next.add(platform)
      return { targets: next }
    }),

  setTargets: (targets) => set({ targets }),

  setStatus: (platform, status) =>
    set((s) => {
      const next = new Map(s.status)
      next.set(platform, status)
      return { status: next }
    }),

  setError: (platform, error) =>
    set((s) => {
      const nextErrors = new Map(s.errors)
      nextErrors.set(platform, error)
      const nextStatus = new Map(s.status)
      nextStatus.set(platform, 'error')
      return { errors: nextErrors, status: nextStatus }
    }),

  setResult: (platform, result) =>
    set((s) => {
      const nextResults = new Map(s.results)
      nextResults.set(platform, result)
      const nextStatus = new Map(s.status)
      nextStatus.set(platform, 'success')
      return { results: nextResults, status: nextStatus }
    }),

  reset: () =>
    set({
      content: '',
      targets: new Set(),
      status: new Map(),
      errors: new Map(),
      results: new Map(),
    }),
}))
