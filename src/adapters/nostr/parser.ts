import type { Event } from 'nostr-tools/core'
import type { NostrProfileContent } from './types'
import type {
  SwitchboardIdentity,
  SwitchboardObject,
  SwitchboardEdge,
} from '@/core/types'

export function parseProfile(event: Event): SwitchboardIdentity {
  let content: NostrProfileContent = {}
  try {
    content = JSON.parse(event.content) as NostrProfileContent
  } catch {
    // malformed profile JSON — use empty defaults
  }

  return {
    platform: 'nostr',
    external_id: event.pubkey,
    handle: content.nip05 || null,
    display_name: content.display_name || content.name || null,
    bio: content.about || null,
    avatar_url: content.picture || null,
    profile_url: content.website || null,
    links: content.website ? [content.website] : [],
    verification_state: 'claimed',
    ownership_proof: null,
    import_source: 'relay',
    created_at: event.created_at,
    updated_at: event.created_at,
  }
}

export function parseNotes(events: Event[]): SwitchboardObject[] {
  return events.map((event) => {
    const replyTo = extractReplyTo(event.tags)
    const tags = extractHashtags(event.tags)

    return {
      platform: 'nostr',
      external_id: event.id,
      canonical_object_id: `nostr:${event.id}`,
      author_identity_ref: event.pubkey,
      kind: 'note',
      body: event.content,
      media_refs: [],
      canonical_url: null,
      created_at: event.created_at,
      updated_at: event.created_at,
      visibility: 'public',
      reply_to: replyTo,
      quote_of: null,
      repost_of: null,
      tags,
      source_payload_ref: event.id,
    }
  })
}

export function parseFollows(event: Event, authorPubkey: string): SwitchboardEdge[] {
  const edges: SwitchboardEdge[] = []
  for (const tag of event.tags) {
    if (tag[0] !== 'p' || !tag[1]) continue
    edges.push({
      source_ref: authorPubkey,
      target_ref: tag[1],
      edge_kind: 'follows',
      platform: 'nostr',
      created_at: event.created_at,
      metadata: tag[2] ? { relay_hint: tag[2] } : {},
    })
  }
  return edges
}

export function extractTagFrequencies(objects: SwitchboardObject[]): Map<string, number> {
  const freq = new Map<string, number>()
  for (const obj of objects) {
    for (const tag of obj.tags) {
      const lower = tag.toLowerCase()
      freq.set(lower, (freq.get(lower) || 0) + 1)
    }
  }
  return freq
}

function extractReplyTo(tags: string[][]): string | null {
  // NIP-10: look for "e" tag with "reply" marker first, then fall back to last "e" tag
  let lastE: string | null = null
  for (const tag of tags) {
    if (tag[0] !== 'e' || !tag[1]) continue
    if (tag[3] === 'reply') return tag[1]
    if (tag[3] === 'root' && !lastE) {
      // if we only see 'root', treat it as the reply target
    }
    lastE = tag[1]
  }
  return lastE
}

function extractHashtags(tags: string[][]): string[] {
  const result: string[] = []
  for (const tag of tags) {
    if (tag[0] === 't' && tag[1]) {
      const cleaned = tag[1].replace(/^#+/, '').toLowerCase()
      if (cleaned.length > 0) result.push(cleaned)
    }
  }
  return result
}
