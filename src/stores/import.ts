import { create } from 'zustand'
import type { PlatformId, SwitchboardIdentity, SwitchboardObject, SwitchboardEdge, SwitchboardCheckpoint } from '@/core/types'

export type ImportStep = 'idle' | 'identifying' | 'fetching' | 'done' | 'error'

interface ImportState {
  platform: PlatformId | null
  step: ImportStep
  identity: SwitchboardIdentity | null
  objects: SwitchboardObject[]
  edges: SwitchboardEdge[]
  checkpoint: SwitchboardCheckpoint | null
  tagFrequencies: Map<string, number>
  error: string | null

  setPlatform: (platform: PlatformId) => void
  setStep: (step: ImportStep) => void
  setIdentity: (identity: SwitchboardIdentity) => void
  setImportData: (data: {
    objects: SwitchboardObject[]
    edges: SwitchboardEdge[]
    checkpoint: SwitchboardCheckpoint | null
    tagFrequencies: Map<string, number>
  }) => void
  setError: (error: string) => void
  reset: () => void
}

const initialState = {
  platform: null,
  step: 'idle' as ImportStep,
  identity: null,
  objects: [],
  edges: [],
  checkpoint: null,
  tagFrequencies: new Map<string, number>(),
  error: null,
}

export const useImportStore = create<ImportState>((set) => ({
  ...initialState,

  setPlatform: (platform) => set({ platform }),
  setStep: (step) => set({ step }),
  setIdentity: (identity) => set({ identity }),
  setImportData: (data) =>
    set({
      objects: data.objects,
      edges: data.edges,
      checkpoint: data.checkpoint,
      tagFrequencies: data.tagFrequencies,
      step: 'done',
    }),
  setError: (error) => set({ error, step: 'error' }),
  reset: () => set(initialState),
}))
