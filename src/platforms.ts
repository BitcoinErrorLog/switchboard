import type { ComponentType } from 'react'
import type { BridgeAdapter } from '@/core/adapter'
import type { PlatformId } from '@/core/types'
import { NostrAdapter } from '@/adapters/nostr'
import { BlueskyAdapter } from '@/adapters/bluesky'

export interface PlatformConfig {
  slug: PlatformId
  name: string
  adapter: BridgeAdapter
  IdentifyComponent: ComponentType | null
  AnnounceComponent: ComponentType | null
  landingCopy: {
    headline: string
    subhead: string
    cta: string
  }
  icon: string
  available: boolean
}

export const COMING_SOON_PLATFORMS: Array<{
  slug: PlatformId
  name: string
  landingCopy: { headline: string; subhead: string; cta: string }
  icon: string
}> = [
  {
    slug: 'x',
    name: 'X',
    landingCopy: {
      headline: 'Bring Your X to Pubky',
      subhead: 'Your tweets. Your threads. Your graph. Actually portable.',
      cta: 'Coming Soon',
    },
    icon: '𝕏',
  },
  {
    slug: 'mastodon',
    name: 'Mastodon',
    landingCopy: {
      headline: 'Bring Your Mastodon to Pubky',
      subhead: 'Your toots. Your follows. Your instance-free.',
      cta: 'Coming Soon',
    },
    icon: '🐘',
  },
]

const platformRegistry = new Map<PlatformId, PlatformConfig>()

platformRegistry.set('nostr', {
  slug: 'nostr',
  name: 'Nostr',
  adapter: new NostrAdapter(),
  IdentifyComponent: null,
  AnnounceComponent: null,
  landingCopy: {
    headline: 'Bring Your Nostr to Pubky',
    subhead: 'Your profile. Your people. Your posts. Imported in seconds.',
    cta: 'Import My Nostr',
  },
  icon: '⚡',
  available: true,
})

platformRegistry.set('bluesky', {
  slug: 'bluesky',
  name: 'Bluesky',
  adapter: new BlueskyAdapter(),
  IdentifyComponent: null,
  AnnounceComponent: null,
  landingCopy: {
    headline: 'Bring Your Bluesky to Pubky',
    subhead: 'Your posts. Your follows. Your feed. Owned by you.',
    cta: 'Import My Bluesky',
  },
  icon: '🦋',
  available: true,
})

export async function getPlatformRegistry(): Promise<Map<PlatformId, PlatformConfig>> {
  await ensureComponents()
  return platformRegistry
}

let componentsLoaded = false

async function ensureComponents(): Promise<void> {
  if (componentsLoaded) return

  const [
    { default: IdentifyNostr },
    { default: AnnounceNostr },
    { default: IdentifyBluesky },
    { default: AnnounceBluesky },
  ] = await Promise.all([
    import('@/components/nostr/IdentifyNostr'),
    import('@/components/nostr/AnnounceNostr'),
    import('@/components/bluesky/IdentifyBluesky'),
    import('@/components/bluesky/AnnounceBluesky'),
  ])

  const nostr = platformRegistry.get('nostr')!
  nostr.IdentifyComponent = IdentifyNostr
  nostr.AnnounceComponent = AnnounceNostr

  const bluesky = platformRegistry.get('bluesky')!
  bluesky.IdentifyComponent = IdentifyBluesky
  bluesky.AnnounceComponent = AnnounceBluesky

  componentsLoaded = true
}

export function getPlatformConfig(slug: PlatformId): PlatformConfig | undefined {
  return platformRegistry.get(slug)
}
