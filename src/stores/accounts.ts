import { create } from 'zustand'
import type { PlatformId, SwitchboardIdentity } from '@/core/types'
import type { Subscription } from '@/core/adapter'

export interface LinkedAccount {
  platform: PlatformId
  identity: SwitchboardIdentity
  connected: boolean
  lastSynced: number | null
  sessionData?: Record<string, unknown>
}

interface AccountsState {
  accounts: Map<PlatformId, LinkedAccount>
  subscriptions: Map<PlatformId, Subscription>

  linkAccount: (account: LinkedAccount) => void
  unlinkAccount: (platform: PlatformId) => void
  getAccount: (platform: PlatformId) => LinkedAccount | undefined
  setSubscription: (platform: PlatformId, sub: Subscription) => void
  clearSubscription: (platform: PlatformId) => void
  updateLastSynced: (platform: PlatformId) => void
  setSessionData: (platform: PlatformId, data: Record<string, unknown>) => void
  reset: () => void
}

const STORAGE_KEY = 'switchboard_accounts'

function loadPersistedAccounts(): Map<PlatformId, LinkedAccount> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Map()
    const entries = JSON.parse(raw) as Array<[PlatformId, LinkedAccount]>
    return new Map(entries)
  } catch {
    return new Map()
  }
}

function persistAccounts(accounts: Map<PlatformId, LinkedAccount>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(accounts.entries())))
  } catch {
    // localStorage unavailable
  }
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: loadPersistedAccounts(),
  subscriptions: new Map(),

  linkAccount: (account) =>
    set((s) => {
      const next = new Map(s.accounts)
      next.set(account.platform, account)
      persistAccounts(next)
      return { accounts: next }
    }),

  unlinkAccount: (platform) =>
    set((s) => {
      const sub = s.subscriptions.get(platform)
      if (sub) sub.close()

      const nextAccounts = new Map(s.accounts)
      nextAccounts.delete(platform)
      persistAccounts(nextAccounts)

      const nextSubs = new Map(s.subscriptions)
      nextSubs.delete(platform)

      return { accounts: nextAccounts, subscriptions: nextSubs }
    }),

  getAccount: (platform) => get().accounts.get(platform),

  setSubscription: (platform, sub) =>
    set((s) => {
      const existing = s.subscriptions.get(platform)
      if (existing) existing.close()
      const next = new Map(s.subscriptions)
      next.set(platform, sub)
      return { subscriptions: next }
    }),

  clearSubscription: (platform) =>
    set((s) => {
      const sub = s.subscriptions.get(platform)
      if (sub) sub.close()
      const next = new Map(s.subscriptions)
      next.delete(platform)
      return { subscriptions: next }
    }),

  updateLastSynced: (platform) =>
    set((s) => {
      const account = s.accounts.get(platform)
      if (!account) return s
      const next = new Map(s.accounts)
      next.set(platform, { ...account, lastSynced: Date.now() })
      persistAccounts(next)
      return { accounts: next }
    }),

  setSessionData: (platform, data) =>
    set((s) => {
      const account = s.accounts.get(platform)
      if (!account) return s
      const next = new Map(s.accounts)
      next.set(platform, { ...account, sessionData: data })
      persistAccounts(next)
      return { accounts: next }
    }),

  reset: () => {
    set((s) => {
      for (const sub of s.subscriptions.values()) sub.close()
      return { accounts: new Map(), subscriptions: new Map() }
    })
    localStorage.removeItem(STORAGE_KEY)
  },
}))
