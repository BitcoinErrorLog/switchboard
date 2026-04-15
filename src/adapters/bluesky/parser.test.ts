import { describe, it, expect } from 'vitest'
import { parseProfile, parseFeedPosts, parseFollows } from './parser'
import { profileRecord, profileRecordMinimal, feedPosts, followsList } from '@/fixtures/bluesky/records'

describe('parseProfile', () => {
  it('parses a full profile', () => {
    const identity = parseProfile(profileRecord, true)
    expect(identity.platform).toBe('bluesky')
    expect(identity.external_id).toBe('did:plc:abc123xyz')
    expect(identity.handle).toBe('alice.bsky.social')
    expect(identity.display_name).toBe('Alice B')
    expect(identity.bio).toBe('Builder of things')
    expect(identity.avatar_url).toBe('https://cdn.bsky.app/avatars/alice.jpg')
    expect(identity.profile_url).toBe('https://bsky.app/profile/alice.bsky.social')
    expect(identity.verification_state).toBe('verified')
    expect(identity.ownership_proof).toBe('session')
  })

  it('parses a minimal profile', () => {
    const identity = parseProfile(profileRecordMinimal, false)
    expect(identity.display_name).toBeNull()
    expect(identity.bio).toBeNull()
    expect(identity.avatar_url).toBeNull()
    expect(identity.verification_state).toBe('claimed')
  })

  it('sets unverified state when not verified', () => {
    const identity = parseProfile(profileRecord, false)
    expect(identity.verification_state).toBe('claimed')
  })
})

describe('parseFeedPosts', () => {
  const authorDid = 'did:plc:abc123xyz'

  it('parses posts from the author only', () => {
    const objects = parseFeedPosts(feedPosts, authorDid)
    expect(objects).toHaveLength(3)
    expect(objects.every((o) => o.author_identity_ref === authorDid)).toBe(true)
  })

  it('filters out posts from other authors', () => {
    const objects = parseFeedPosts(feedPosts, authorDid)
    const otherAuthorPost = objects.find(
      (o) => o.external_id === 'at://did:plc:other999/app.bsky.feed.post/rkey_other',
    )
    expect(otherAuthorPost).toBeUndefined()
  })

  it('extracts tags from record.tags', () => {
    const objects = parseFeedPosts(feedPosts, authorDid)
    expect(objects[0].tags).toContain('pubky')
    expect(objects[0].tags).toContain('switchboard')
  })

  it('extracts tags from facets', () => {
    const objects = parseFeedPosts(feedPosts, authorDid)
    const facetPost = objects.find((o) => o.body === 'Post with facet tag')
    expect(facetPost?.tags).toContain('crypto')
  })

  it('extracts reply_to from reply ref', () => {
    const objects = parseFeedPosts(feedPosts, authorDid)
    const replyPost = objects.find((o) => o.body === 'Replying to someone')
    expect(replyPost?.reply_to).toBe('at://did:plc:other/app.bsky.feed.post/parent1')
  })

  it('constructs canonical_url', () => {
    const objects = parseFeedPosts(feedPosts, authorDid)
    expect(objects[0].canonical_url).toBe('https://bsky.app/profile/alice.bsky.social/post/rkey001')
  })

  it('returns empty for empty feed', () => {
    const objects = parseFeedPosts([], authorDid)
    expect(objects).toHaveLength(0)
  })
})

describe('parseFollows', () => {
  it('parses follow edges', () => {
    const edges = parseFollows(followsList, 'did:plc:abc123xyz')
    expect(edges).toHaveLength(3)
    expect(edges[0].edge_kind).toBe('follows')
    expect(edges[0].source_ref).toBe('did:plc:abc123xyz')
    expect(edges[0].target_ref).toBe('did:plc:follow001')
    expect(edges[0].metadata).toEqual({ handle: 'bob.bsky.social' })
  })

  it('returns empty for empty follows', () => {
    const edges = parseFollows([], 'did:plc:abc123xyz')
    expect(edges).toHaveLength(0)
  })
})
