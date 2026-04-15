import type { PlatformId } from '@/core/types'

const store = new Map<string, string>()

function makeKey(platform: PlatformId, externalId: string): string {
  return `${platform}:${externalId}`
}

export function registerLink(
  platform: PlatformId,
  externalId: string,
  pubkyId: string,
): void {
  store.set(makeKey(platform, externalId), pubkyId)
}

export function lookupPubkyId(
  platform: PlatformId,
  externalId: string,
): string | null {
  return store.get(makeKey(platform, externalId)) ?? null
}

export function seedLinks(
  entries: Array<{ platform: PlatformId; externalId: string; pubkyId: string }>,
): void {
  for (const entry of entries) {
    registerLink(entry.platform, entry.externalId, entry.pubkyId)
  }
}

export function getAllLinks(): Map<string, string> {
  return new Map(store)
}

export function clearLinks(): void {
  store.clear()
}
