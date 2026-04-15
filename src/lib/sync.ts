import type { PlatformId, SwitchboardObject } from '@/core/types'
import type { Subscription } from '@/core/adapter'
import { getPlatformConfig } from '@/platforms'
import { useAccountsStore, type LinkedAccount } from '@/stores/accounts'
import { mapObjectToPost } from '@/core/mapper'
import { writeJson } from '@/lib/pubky'
import type { Session } from '@synonymdev/pubky'

const SYNC_CURSOR_PREFIX = 'switchboard_sync_cursor_'
const SYNC_IDS_KEY = 'switchboard_synced_ids'
const OUTBOUND_POLL_MS = 60000

interface SyncedIdMap {
  [canonicalId: string]: Partial<Record<PlatformId, string>>
}

function loadSyncedIds(): SyncedIdMap {
  try {
    const raw = localStorage.getItem(SYNC_IDS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveSyncedIds(ids: SyncedIdMap) {
  try {
    localStorage.setItem(SYNC_IDS_KEY, JSON.stringify(ids))
  } catch {
    // localStorage unavailable
  }
}

function loadCursor(platform: PlatformId): string | null {
  try {
    return localStorage.getItem(SYNC_CURSOR_PREFIX + platform)
  } catch {
    return null
  }
}

function saveCursor(platform: PlatformId, cursor: string) {
  try {
    localStorage.setItem(SYNC_CURSOR_PREFIX + platform, cursor)
  } catch {
    // localStorage unavailable
  }
}

function isAlreadySynced(syncedIds: SyncedIdMap, canonicalId: string): boolean {
  return canonicalId in syncedIds
}

function recordSync(
  syncedIds: SyncedIdMap,
  canonicalId: string,
  platform: PlatformId,
  externalId: string,
) {
  if (!syncedIds[canonicalId]) {
    syncedIds[canonicalId] = {}
  }
  syncedIds[canonicalId][platform] = externalId
  saveSyncedIds(syncedIds)
}

export function startInboundSync(
  account: LinkedAccount,
  pubkySession: Session,
  pubkyId: string,
): Subscription | null {
  const config = getPlatformConfig(account.platform)
  if (!config?.adapter.subscribe) return null

  const syncedIds = loadSyncedIds()

  const subscription = config.adapter.subscribe({
    identity: account.identity,
    onObject: async (object: SwitchboardObject) => {
      if (isAlreadySynced(syncedIds, object.canonical_object_id)) return

      const mapped = mapObjectToPost(object, pubkyId)
      if (!mapped) return

      try {
        await writeJson(pubkySession, mapped.path as `/pub/${string}`, mapped.json)
        recordSync(syncedIds, object.canonical_object_id, account.platform, object.external_id)
        useAccountsStore.getState().updateLastSynced(account.platform)
      } catch {
        // write failed, will retry on next event
      }
    },
    onEose: () => {
      const cursor = String(Math.floor(Date.now() / 1000))
      saveCursor(account.platform, cursor)
    },
  })

  useAccountsStore.getState().setSubscription(account.platform, subscription)
  return subscription
}

export function startOutboundSync(
  pubkySession: Session,
  pubkyId: string,
  linkedAccounts: LinkedAccount[],
): { stop: () => void } {
  const syncedIds = loadSyncedIds()
  let running = true
  let timeoutId: ReturnType<typeof setTimeout>

  const poll = async () => {
    if (!running) return

    for (const account of linkedAccounts) {
      const config = getPlatformConfig(account.platform)
      if (!config) continue

      const cursor = loadCursor(`pubky_outbound_${account.platform}` as PlatformId)

      try {
        const data = await pubkySession.storage.list('/pub/pubky.app/posts/')
        if (!data || data.length === 0) continue

        for (const entry of data) {
          const canonicalId = `pubky:${pubkyId}:${entry}`
          if (isAlreadySynced(syncedIds, canonicalId)) continue

          try {
            const postData = await pubkySession.storage.getJson(entry as `/pub/${string}`)
            if (!postData?.content) continue

            const result = await config.adapter.publish({
              content: postData.content,
              identity: account.identity,
            })

            if (result.success && result.external_id) {
              recordSync(syncedIds, canonicalId, account.platform, result.external_id)
            }
          } catch {
            // individual post syndication failure, continue
          }
        }

        saveCursor(`pubky_outbound_${account.platform}` as PlatformId, String(Date.now()))
      } catch {
        // storage listing failed, retry next poll
      }
    }

    if (running) {
      timeoutId = setTimeout(poll, OUTBOUND_POLL_MS)
    }
  }

  poll()

  return {
    stop() {
      running = false
      clearTimeout(timeoutId)
    },
  }
}

export function stopAllSync() {
  const store = useAccountsStore.getState()
  for (const [platform] of store.subscriptions) {
    store.clearSubscription(platform)
  }
}
