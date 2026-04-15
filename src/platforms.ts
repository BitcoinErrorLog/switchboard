import type { ComponentType } from 'react'
import type { BridgeAdapter } from '@/core/adapter'
import type { PlatformId } from '@/core/types'
import { NostrAdapter } from '@/adapters/nostr'

export interface PlatformConfig {
  slug: PlatformId
  name: string
  adapter: BridgeAdapter
  IdentifyComponent: ComponentType
  AnnounceComponent: ComponentType
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
    slug: 'bluesky',
    name: 'Bluesky',
    landingCopy: {
      headline: 'Bring Your Bluesky to Pubky',
      subhead: 'Your posts. Your follows. Your feed. Owned by you.',
      cta: 'Coming Soon',
    },
    icon: '🦋',
  },
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

let platformRegistry: Map<PlatformId, PlatformConfig> | null = null

export async function getPlatformRegistry(): Promise<Map<PlatformId, PlatformConfig>> {
  if (platformRegistry) return platformRegistry

  const { default: IdentifyNostr } = await import('@/components/nostr/IdentifyNostr')
  const { default: AnnounceNostr } = await import('@/components/nostr/AnnounceNostr')

  platformRegistry = new Map()
  platformRegistry.set('nostr', {
    slug: 'nostr',
    name: 'Nostr',
    adapter: new NostrAdapter(),
    IdentifyComponent: IdentifyNostr,
    AnnounceComponent: AnnounceNostr,
    landingCopy: {
      headline: 'Bring Your Nostr to Pubky',
      subhead: 'Your profile. Your people. Your posts. Imported in seconds.',
      cta: 'Import My Nostr',
    },
    icon: '⚡',
    available: true,
  })

  return platformRegistry
}

export function getPlatformConfig(slug: PlatformId): PlatformConfig | undefined {
  return platformRegistry?.get(slug)
}
