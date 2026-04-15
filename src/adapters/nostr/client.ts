import { SimplePool } from 'nostr-tools/pool'
import type { Event } from 'nostr-tools/core'
import type { SubCloser } from 'nostr-tools/abstract-pool'
import { BOOTSTRAP_RELAYS, RELAY_TIMEOUT_MS, parseRelayListEvent, getReadRelays } from './relays'

let pool: SimplePool | null = null

function getPool(): SimplePool {
  if (!pool) {
    pool = new SimplePool()
  }
  return pool
}

export function destroyPool(): void {
  if (pool) {
    pool.destroy()
    pool = null
  }
}

export interface FetchedUserData {
  profile: Event | null
  notes: Event[]
  contacts: Event | null
  relayList: Event | null
}

export async function fetchRelayList(hexPubkey: string): Promise<Event | null> {
  const p = getPool()
  return p.get(BOOTSTRAP_RELAYS, {
    authors: [hexPubkey],
    kinds: [10002],
  }, { maxWait: RELAY_TIMEOUT_MS })
}

export async function fetchUserData(
  hexPubkey: string,
  noteLimit = 200,
): Promise<FetchedUserData> {
  const p = getPool()

  const relayListEvent = await fetchRelayList(hexPubkey)
  let queryRelays = BOOTSTRAP_RELAYS

  if (relayListEvent) {
    const infos = parseRelayListEvent(relayListEvent.tags)
    const readRelays = getReadRelays(infos)
    if (readRelays.length > 0) {
      queryRelays = readRelays
    }
  }

  const [profile, contacts, notes] = await Promise.all([
    p.get(queryRelays, {
      authors: [hexPubkey],
      kinds: [0],
    }, { maxWait: RELAY_TIMEOUT_MS }),

    p.get(queryRelays, {
      authors: [hexPubkey],
      kinds: [3],
    }, { maxWait: RELAY_TIMEOUT_MS }),

    p.querySync(queryRelays, {
      authors: [hexPubkey],
      kinds: [1],
      limit: noteLimit,
    }, { maxWait: RELAY_TIMEOUT_MS }),
  ])

  return {
    profile,
    notes,
    contacts,
    relayList: relayListEvent,
  }
}

export async function publishEvent(
  event: Event,
  writeRelays?: string[],
): Promise<void> {
  const p = getPool()
  const relays = writeRelays && writeRelays.length > 0
    ? writeRelays
    : BOOTSTRAP_RELAYS

  const results = p.publish(relays, event)
  await Promise.allSettled(results)
}

export function subscribeToUser(
  hexPubkey: string,
  relays: string[],
  callbacks: {
    onEvent: (event: Event) => void
    onEose?: () => void
  },
): SubCloser {
  const p = getPool()
  const queryRelays = relays.length > 0 ? relays : BOOTSTRAP_RELAYS

  return p.subscribeMany(
    queryRelays,
    { authors: [hexPubkey], kinds: [0, 1, 3] },
    {
      onevent: callbacks.onEvent,
      oneose: callbacks.onEose,
    },
  )
}

export async function queryFeed(
  hexPubkey: string,
  relays: string[],
  options: { limit?: number; until?: number },
): Promise<Event[]> {
  const p = getPool()
  const queryRelays = relays.length > 0 ? relays : BOOTSTRAP_RELAYS

  const filter: Record<string, unknown> = {
    authors: [hexPubkey],
    kinds: [1],
    limit: options.limit ?? 50,
  }
  if (options.until) {
    filter.until = options.until
  }

  return p.querySync(queryRelays, filter as any, { maxWait: RELAY_TIMEOUT_MS })
}
