import type {
  BridgeAdapter,
  CapabilityManifest,
  ClaimInput,
  ClaimResult,
  VerifyInput,
  VerifyResult,
  BackfillInput,
  BackfillJobResult,
  PublishInput,
  PublishResult,
  FeedInput,
  FeedResult,
  SubscribeInput,
  Subscription,
} from '@/core/adapter'
import type { PlatformId, SwitchboardObject } from '@/core/types'
import { resolveHandle, loginAndVerify } from './identity'
import { getAgent, logout } from './client'
import { parseProfile, parseFeedPosts, parseFollows } from './parser'
import { publishPost } from './publisher'
import { extractTagFrequencies } from '@/adapters/nostr/parser'

export class BlueskyAdapter implements BridgeAdapter {
  private credentials: { identifier: string; password: string } | null = null

  platform(): PlatformId {
    return 'bluesky'
  }

  capabilities(): CapabilityManifest {
    return {
      claim_identity: true,
      verify_ownership: true,
      archive_import: false,
      live_sync: false,
      publish: true,
      reply_publish: true,
      delete_publish: false,
      graph_import: true,
      media_import: false,
      webhooks: false,
      oauth: false,
      official_export: false,
      scraping: false,
      read_only: false,
    }
  }

  setCredentials(identifier: string, password: string) {
    this.credentials = { identifier, password }
  }

  async claimIdentity(input: ClaimInput): Promise<ClaimResult> {
    const handle = input.raw_identifier.replace(/^@/, '')

    if (!this.credentials) {
      const did = await resolveHandle(handle)
      const agent = new (await import('@atproto/api')).Agent('https://bsky.social')
      const profileRes = await agent.getProfile({ actor: did })
      const identity = parseProfile(profileRes.data, false)
      return { identity }
    }

    const { did, handle: resolvedHandle } = await loginAndVerify(this.credentials)
    const agent = getAgent()!
    const profileRes = await agent.getProfile({ actor: did })
    const identity = parseProfile(profileRes.data, true)
    identity.handle = resolvedHandle

    return { identity }
  }

  async verifyOwnership(input: VerifyInput): Promise<VerifyResult> {
    const agent = getAgent()
    if (!agent) {
      return {
        verified: false,
        proof: null,
        identity: input.identity,
      }
    }

    try {
      const profileRes = await agent.getProfile({ actor: input.identity.external_id })
      return {
        verified: true,
        proof: 'session',
        identity: {
          ...input.identity,
          verification_state: 'verified',
          ownership_proof: 'session',
          handle: profileRes.data.handle,
        },
      }
    } catch {
      return {
        verified: false,
        proof: null,
        identity: input.identity,
      }
    }
  }

  async backfill(input: BackfillInput): Promise<BackfillJobResult> {
    const agent = getAgent()
    if (!agent) throw new Error('Not authenticated with Bluesky')

    const did = input.identity.external_id
    const limit = input.limit ?? 200

    const [feedRes, followsRes] = await Promise.all([
      this.fetchAllPosts(did, limit),
      this.fetchAllFollows(did),
    ])

    const objects = parseFeedPosts(feedRes, did)
    const edges = parseFollows(followsRes, did)
    const tagFrequencies = extractTagFrequencies(objects)

    return {
      objects,
      edges,
      signals: [],
      checkpoint: {
        platform: 'bluesky',
        scope: did,
        cursor: null,
        since_token: null,
        last_success_at: Math.floor(Date.now() / 1000),
        backfill_watermark: null,
        relay_state: {
          relays_queried: ['https://bsky.social'],
          last_query_at: Math.floor(Date.now() / 1000),
        },
        metadata: {},
      },
      tag_frequencies: tagFrequencies,
    }
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const result = await publishPost(input.content)
    return {
      success: result.success,
      external_id: result.uri,
      url: result.uri ? this.uriToUrl(result.uri) : null,
    }
  }

  subscribe(input: SubscribeInput): Subscription {
    const did = input.identity.external_id
    let running = true
    let cursor: string | undefined
    let timeoutId: ReturnType<typeof setTimeout>

    const poll = async () => {
      if (!running) return
      const agent = getAgent()
      if (!agent) return

      try {
        const res = await agent.getAuthorFeed({
          actor: did,
          limit: 20,
          cursor,
        })

        if (res.data.feed.length > 0) {
          const objects = parseFeedPosts(res.data.feed, did)
          for (const obj of objects) {
            input.onObject?.(obj)
          }
          cursor = res.data.cursor
        }
      } catch {
        // silently retry on next poll
      }

      if (running) {
        timeoutId = setTimeout(poll, 30000)
      }
    }

    poll()

    return {
      close() {
        running = false
        clearTimeout(timeoutId)
      },
    }
  }

  async fetchFeed(input: FeedInput): Promise<FeedResult> {
    const agent = getAgent()
    if (!agent) throw new Error('Not authenticated with Bluesky')

    const res = await agent.getAuthorFeed({
      actor: input.identity.external_id,
      limit: input.limit ?? 50,
      cursor: input.cursor ?? undefined,
    })

    const objects = parseFeedPosts(res.data.feed, input.identity.external_id)

    return {
      objects,
      cursor: res.data.cursor ?? null,
      has_more: !!res.data.cursor,
    }
  }

  disconnect(): void {
    logout()
    this.credentials = null
  }

  private async fetchAllPosts(
    did: string,
    limit: number,
  ): Promise<import('@atproto/api').AppBskyFeedDefs.FeedViewPost[]> {
    const agent = getAgent()!
    const all: import('@atproto/api').AppBskyFeedDefs.FeedViewPost[] = []
    let cursor: string | undefined

    while (all.length < limit) {
      const batch = Math.min(100, limit - all.length)
      const res = await agent.getAuthorFeed({
        actor: did,
        limit: batch,
        cursor,
      })
      all.push(...res.data.feed)
      if (!res.data.cursor || res.data.feed.length === 0) break
      cursor = res.data.cursor
    }

    return all
  }

  private async fetchAllFollows(
    did: string,
  ): Promise<import('@atproto/api').AppBskyActorDefs.ProfileView[]> {
    const agent = getAgent()!
    const all: import('@atproto/api').AppBskyActorDefs.ProfileView[] = []
    let cursor: string | undefined

    while (true) {
      const res = await agent.getFollows({
        actor: did,
        limit: 100,
        cursor,
      })
      all.push(...res.data.follows)
      if (!res.data.cursor || res.data.follows.length === 0) break
      cursor = res.data.cursor
    }

    return all
  }

  private uriToUrl(uri: string): string {
    const parts = uri.split('/')
    const rkey = parts[parts.length - 1]
    const did = parts[2]
    return `https://bsky.app/profile/${did}/post/${rkey}`
  }
}
