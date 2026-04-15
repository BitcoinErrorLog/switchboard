import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('pubky-app-specs', () => {
  class MockPubkyAppUserLink {
    title: string
    url: string
    constructor(title: string, url: string) {
      this.title = title
      this.url = url
    }
  }

  class MockPubkySpecsBuilder {
    private pubkyId: string
    constructor(pubkyId: string) {
      this.pubkyId = pubkyId
    }
    createUser(name: string, bio: string | null, image: string | null, links: any[], status: any) {
      return {
        user: { toJson: () => ({ name, bio, image, links, status }) },
        meta: { path: `/pub/pubky.app/profile.json`, url: `pubky://${this.pubkyId}/pub/pubky.app/profile.json` },
      }
    }
    createPost(content: string, kind: any, _parent: any, _embed: any, _attachments: any) {
      const id = 'post_' + Date.now()
      return {
        post: { toJson: () => ({ content, kind }) },
        meta: { path: `/pub/pubky.app/posts/${id}`, url: `pubky://${this.pubkyId}/pub/pubky.app/posts/${id}`, id },
      }
    }
    createFollow(followeePubkyId: string) {
      return {
        follow: { toJson: () => ({ pubky_id: followeePubkyId }) },
        meta: { path: `/pub/pubky.app/follows/${followeePubkyId}`, url: `pubky://${this.pubkyId}/pub/pubky.app/follows/${followeePubkyId}` },
      }
    }
    createTag(uri: string, label: string) {
      const id = 'tag_' + Date.now()
      return {
        tag: { toJson: () => ({ uri, label }) },
        meta: { path: `/pub/pubky.app/tags/${id}`, url: `pubky://${this.pubkyId}/pub/pubky.app/tags/${id}` },
      }
    }
  }

  return {
    PubkySpecsBuilder: MockPubkySpecsBuilder,
    PubkyAppUserLink: MockPubkyAppUserLink,
    PubkyAppPostKind: { Short: 'short', Long: 'long' },
  }
})

import { mapIdentityToUser, mapObjectToPost, mapEdgeToFollow, mapTagToTag } from './mapper'
import type { SwitchboardIdentity, SwitchboardObject, SwitchboardEdge } from './types'

const baseIdentity: SwitchboardIdentity = {
  platform: 'nostr',
  external_id: 'hex123',
  handle: 'alice@example.com',
  display_name: 'Alice',
  bio: 'Hello world',
  avatar_url: 'https://example.com/avatar.jpg',
  profile_url: 'https://example.com',
  links: ['https://example.com'],
  verification_state: 'verified',
  ownership_proof: 'sig',
  import_source: 'relay',
  created_at: 1700000000,
  updated_at: 1700000000,
}

const baseObject: SwitchboardObject = {
  platform: 'nostr',
  external_id: 'note001',
  canonical_object_id: 'nostr:note001',
  author_identity_ref: 'hex123',
  kind: 'note',
  body: 'Hello world!',
  media_refs: [],
  canonical_url: null,
  created_at: 1700001000,
  updated_at: 1700001000,
  visibility: 'public',
  reply_to: null,
  quote_of: null,
  repost_of: null,
  tags: ['bitcoin'],
  source_payload_ref: 'note001',
}

describe('mapIdentityToUser', () => {
  it('maps identity to user profile', () => {
    const result = mapIdentityToUser(baseIdentity, 'pubky_abc')
    expect(result.json.name).toBe('Alice')
    expect(result.json.bio).toBe('Hello world')
    expect(result.path).toContain('profile.json')
  })

  it('uses anonymous for null name', () => {
    const result = mapIdentityToUser({ ...baseIdentity, display_name: null }, 'pubky_abc')
    expect(result.json.name).toBe('anonymous')
  })

  it('truncates long bio', () => {
    const longBio = 'x'.repeat(200)
    const result = mapIdentityToUser({ ...baseIdentity, bio: longBio }, 'pubky_abc')
    expect(result.json.bio.length).toBeLessThanOrEqual(160)
  })

  it('rejects overly long image URL', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(300)
    const result = mapIdentityToUser({ ...baseIdentity, avatar_url: longUrl }, 'pubky_abc')
    expect(result.json.image).toBeNull()
  })
})

describe('mapObjectToPost', () => {
  it('maps object to post', () => {
    const result = mapObjectToPost(baseObject, 'pubky_abc')
    expect(result).not.toBeNull()
    expect(result!.json.content).toBe('Hello world!')
    expect(result!.path).toContain('posts/')
  })

  it('returns null for empty content', () => {
    const result = mapObjectToPost({ ...baseObject, body: '   ' }, 'pubky_abc')
    expect(result).toBeNull()
  })

  it('truncates long content', () => {
    const longContent = 'x'.repeat(3000)
    const result = mapObjectToPost({ ...baseObject, body: longContent }, 'pubky_abc')
    expect(result!.json.content.length).toBeLessThanOrEqual(2000)
  })
})

describe('mapEdgeToFollow', () => {
  it('maps edge to follow', () => {
    const edge: SwitchboardEdge = {
      source_ref: 'hex123',
      target_ref: 'hex456',
      edge_kind: 'follows',
      platform: 'nostr',
      created_at: 1700000000,
      metadata: {},
    }
    const result = mapEdgeToFollow(edge, 'pubky_abc', 'pubky_def')
    expect(result.path).toContain('follows/')
  })
})

describe('mapTagToTag', () => {
  it('maps a valid tag', () => {
    const result = mapTagToTag('bitcoin', 'pubky://host/pub/pubky.app/posts/123', 'pubky_abc')
    expect(result).not.toBeNull()
    expect(result!.json.label).toBe('bitcoin')
  })

  it('strips # prefix', () => {
    const result = mapTagToTag('#bitcoin', 'pubky://host/pub/pubky.app/posts/123', 'pubky_abc')
    expect(result).not.toBeNull()
    expect(result!.json.label).toBe('bitcoin')
  })

  it('strips multiple # prefixes', () => {
    const result = mapTagToTag('##bitcoin', 'pubky://host/pub/pubky.app/posts/123', 'pubky_abc')
    expect(result).not.toBeNull()
    expect(result!.json.label).toBe('bitcoin')
  })

  it('returns null for empty tag after sanitization', () => {
    const result = mapTagToTag('###', 'pubky://host/pub/pubky.app/posts/123', 'pubky_abc')
    expect(result).toBeNull()
  })

  it('returns null for tag over 20 chars', () => {
    const result = mapTagToTag('a'.repeat(21), 'pubky://host/pub/pubky.app/posts/123', 'pubky_abc')
    expect(result).toBeNull()
  })

  it('strips whitespace and special chars', () => {
    const result = mapTagToTag(' bit coin ', 'pubky://host/pub/pubky.app/posts/123', 'pubky_abc')
    expect(result).not.toBeNull()
    expect(result!.json.label).toBe('bitcoin')
  })
})
