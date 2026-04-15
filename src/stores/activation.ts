import { create } from 'zustand'
import type { Session } from '@synonymdev/pubky'

export type ActivationMode = 'new' | 'existing'
export type MergeStrategy = 'full' | 'additive' | 'link_only'

export type ActivationStep =
  | 'idle'
  | 'choosing_mode'
  | 'authenticating'
  | 'choosing_merge'
  | 'generating_keypair'
  | 'backup_mnemonic'
  | 'signing_up'
  | 'writing_profile'
  | 'writing_follows'
  | 'writing_posts'
  | 'writing_tags'
  | 'complete'
  | 'error'

interface ActivationState {
  mode: ActivationMode | null
  mergeStrategy: MergeStrategy
  step: ActivationStep
  mnemonic: string | null
  pubkyId: string | null
  session: Session | null
  profileWritten: boolean
  followsWritten: number
  postsWritten: number
  tagsWritten: number
  totalFollows: number
  totalPosts: number
  totalTags: number
  error: string | null

  setMode: (mode: ActivationMode) => void
  setMergeStrategy: (strategy: MergeStrategy) => void
  setStep: (step: ActivationStep) => void
  setKeypair: (mnemonic: string, pubkyId: string) => void
  setSession: (session: Session) => void
  setExistingSession: (session: Session, pubkyId: string) => void
  setProfileWritten: () => void
  incrementFollows: () => void
  incrementPosts: () => void
  incrementTags: () => void
  setTotals: (follows: number, posts: number, tags: number) => void
  setError: (error: string) => void
  reset: () => void
}

const initialState = {
  mode: null as ActivationMode | null,
  mergeStrategy: 'full' as MergeStrategy,
  step: 'idle' as ActivationStep,
  mnemonic: null,
  pubkyId: null,
  session: null,
  profileWritten: false,
  followsWritten: 0,
  postsWritten: 0,
  tagsWritten: 0,
  totalFollows: 0,
  totalPosts: 0,
  totalTags: 0,
  error: null,
}

export const useActivationStore = create<ActivationState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),
  setMergeStrategy: (strategy) => set({ mergeStrategy: strategy }),
  setStep: (step) => set({ step }),
  setKeypair: (mnemonic, pubkyId) => set({ mnemonic, pubkyId }),
  setSession: (session) => set({ session }),
  setExistingSession: (session, pubkyId) => set({ session, pubkyId }),
  setProfileWritten: () => set({ profileWritten: true }),
  incrementFollows: () => set((s) => ({ followsWritten: s.followsWritten + 1 })),
  incrementPosts: () => set((s) => ({ postsWritten: s.postsWritten + 1 })),
  incrementTags: () => set((s) => ({ tagsWritten: s.tagsWritten + 1 })),
  setTotals: (follows, posts, tags) =>
    set({ totalFollows: follows, totalPosts: posts, totalTags: tags }),
  setError: (error) => set({ error, step: 'error' }),
  reset: () => set(initialState),
}))
