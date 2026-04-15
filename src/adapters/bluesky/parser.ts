import type {
  SwitchboardIdentity,
  SwitchboardObject,
  SwitchboardEdge,
} from '@/core/types'
import type {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyRichtextFacet,
} from '@atproto/api'

export function parseProfile(
  profile: AppBskyActorDefs.ProfileViewDetailed,
  verified: boolean,
): SwitchboardIdentity {
  const now = Math.floor(Date.now() / 1000)
  return {
    platform: 'bluesky',
    external_id: profile.did,
    handle: profile.handle,
    display_name: profile.displayName || null,
    bio: profile.description || null,
    avatar_url: profile.avatar || null,
    profile_url: `https://bsky.app/profile/${profile.handle}`,
    links: [],
    verification_state: verified ? 'verified' : 'claimed',
    ownership_proof: verified ? 'session' : null,
    import_source: 'api',
    created_at: profile.indexedAt ? Math.floor(new Date(profile.indexedAt).getTime() / 1000) : now,
    updated_at: now,
  }
}

export function parseFeedPosts(
  feed: AppBskyFeedDefs.FeedViewPost[],
  authorDid: string,
): SwitchboardObject[] {
  const results: SwitchboardObject[] = []

  for (const item of feed) {
    const post = item.post
    if (post.author.did !== authorDid) continue

    const record = post.record as {
      text?: string
      createdAt?: string
      reply?: { parent?: { uri?: string } }
      facets?: AppBskyRichtextFacet.Main[]
      tags?: string[]
    }

    if (!record.text) continue

    const tags = extractTags(record)
    const createdAt = record.createdAt
      ? Math.floor(new Date(record.createdAt).getTime() / 1000)
      : Math.floor(Date.now() / 1000)

    results.push({
      platform: 'bluesky',
      external_id: post.uri,
      canonical_object_id: `bluesky:${post.uri}`,
      author_identity_ref: authorDid,
      kind: 'note',
      body: record.text,
      media_refs: [],
      canonical_url: postUriToUrl(post.uri, post.author.handle),
      created_at: createdAt,
      updated_at: createdAt,
      visibility: 'public',
      reply_to: record.reply?.parent?.uri || null,
      quote_of: null,
      repost_of: null,
      tags,
      source_payload_ref: post.cid,
    })
  }

  return results
}

export function parseFollows(
  follows: AppBskyActorDefs.ProfileView[],
  authorDid: string,
): SwitchboardEdge[] {
  const now = Math.floor(Date.now() / 1000)
  return follows.map((follow) => ({
    source_ref: authorDid,
    target_ref: follow.did,
    edge_kind: 'follows' as const,
    platform: 'bluesky' as const,
    created_at: now,
    metadata: { handle: follow.handle },
  }))
}

function extractTags(record: {
  facets?: AppBskyRichtextFacet.Main[]
  tags?: string[]
}): string[] {
  const tags: string[] = []

  if (record.tags) {
    for (const tag of record.tags) {
      const cleaned = tag.replace(/^#+/, '').toLowerCase()
      if (cleaned.length > 0) tags.push(cleaned)
    }
  }

  if (record.facets) {
    for (const facet of record.facets) {
      for (const feature of facet.features) {
        if (feature.$type === 'app.bsky.richtext.facet#tag' && 'tag' in feature) {
          const cleaned = (feature.tag as string).replace(/^#+/, '').toLowerCase()
          if (cleaned.length > 0 && !tags.includes(cleaned)) {
            tags.push(cleaned)
          }
        }
      }
    }
  }

  return tags
}

function postUriToUrl(uri: string, handle: string): string {
  const parts = uri.split('/')
  const rkey = parts[parts.length - 1]
  return `https://bsky.app/profile/${handle}/post/${rkey}`
}
