import { create } from 'zustand'
import type { Session } from '@synonymdev/pubky'

export type ActivationStep =
  | 'idle'
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

  setStep: (step: ActivationStep) => void
  setKeypair: (mnemonic: string, pubkyId: string) => void
  setSession: (session: Session) => void
  setProfileWritten: () => void
  incrementFollows: () => void
  incrementPosts: () => void
  incrementTags: () => void
  setTotals: (follows: number, posts: number, tags: number) => void
  setError: (error: string) => void
  reset: () => void
}

const initialState = {
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

  setStep: (step) => set({ step }),
  setKeypair: (mnemonic, pubkyId) => set({ mnemonic, pubkyId }),
  setSession: (session) => set({ session }),
  setProfileWritten: () => set({ profileWritten: true }),
  incrementFollows: () => set((s) => ({ followsWritten: s.followsWritten + 1 })),
  incrementPosts: () => set((s) => ({ postsWritten: s.postsWritten + 1 })),
  incrementTags: () => set((s) => ({ tagsWritten: s.tagsWritten + 1 })),
  setTotals: (follows, posts, tags) =>
    set({ totalFollows: follows, totalPosts: posts, totalTags: tags }),
  setError: (error) => set({ error, step: 'error' }),
  reset: () => set(initialState),
}))
