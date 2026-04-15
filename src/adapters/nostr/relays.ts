import type { RelayInfo } from './types'

export const BOOTSTRAP_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.primal.net',
]

export const RELAY_TIMEOUT_MS = 5000

export function parseRelayListEvent(tags: string[][]): RelayInfo[] {
  const relays: RelayInfo[] = []
  for (const tag of tags) {
    if (tag[0] !== 'r' || !tag[1]) continue
    const url = tag[1]
    const marker = tag[2] as 'read' | 'write' | undefined
    relays.push({
      url,
      access: marker ?? 'both',
    })
  }
  return relays
}

export function getWriteRelays(relayInfos: RelayInfo[]): string[] {
  return relayInfos
    .filter((r) => r.access === 'write' || r.access === 'both')
    .map((r) => r.url)
}

export function getReadRelays(relayInfos: RelayInfo[]): string[] {
  return relayInfos
    .filter((r) => r.access === 'read' || r.access === 'both')
    .map((r) => r.url)
}
