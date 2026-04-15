import type { AppBskyActorDefs, AppBskyFeedDefs } from '@atproto/api'

export const profileRecord: AppBskyActorDefs.ProfileViewDetailed = {
  did: 'did:plc:abc123xyz',
  handle: 'alice.bsky.social',
  displayName: 'Alice B',
  description: 'Builder of things',
  avatar: 'https://cdn.bsky.app/avatars/alice.jpg',
  indexedAt: '2024-01-15T10:00:00.000Z',
  followersCount: 150,
  followsCount: 75,
  postsCount: 42,
}

export const profileRecordMinimal: AppBskyActorDefs.ProfileViewDetailed = {
  did: 'did:plc:minimal000',
  handle: 'minimal.bsky.social',
  indexedAt: '2024-06-01T00:00:00.000Z',
}

export const feedPosts: AppBskyFeedDefs.FeedViewPost[] = [
  {
    post: {
      uri: 'at://did:plc:abc123xyz/app.bsky.feed.post/rkey001',
      cid: 'cid001',
      author: {
        did: 'did:plc:abc123xyz',
        handle: 'alice.bsky.social',
        displayName: 'Alice B',
      },
      record: {
        $type: 'app.bsky.feed.post',
        text: 'Hello from Bluesky!',
        createdAt: '2024-06-15T12:00:00.000Z',
        tags: ['pubky', 'switchboard'],
      },
      indexedAt: '2024-06-15T12:00:01.000Z',
      likeCount: 5,
      repostCount: 1,
      replyCount: 0,
    },
  },
  {
    post: {
      uri: 'at://did:plc:abc123xyz/app.bsky.feed.post/rkey002',
      cid: 'cid002',
      author: {
        did: 'did:plc:abc123xyz',
        handle: 'alice.bsky.social',
        displayName: 'Alice B',
      },
      record: {
        $type: 'app.bsky.feed.post',
        text: 'Replying to someone',
        createdAt: '2024-06-15T13:00:00.000Z',
        reply: {
          parent: { uri: 'at://did:plc:other/app.bsky.feed.post/parent1' },
        },
      },
      indexedAt: '2024-06-15T13:00:01.000Z',
      likeCount: 2,
      repostCount: 0,
      replyCount: 0,
    },
  },
  {
    post: {
      uri: 'at://did:plc:abc123xyz/app.bsky.feed.post/rkey003',
      cid: 'cid003',
      author: {
        did: 'did:plc:abc123xyz',
        handle: 'alice.bsky.social',
        displayName: 'Alice B',
      },
      record: {
        $type: 'app.bsky.feed.post',
        text: 'Post with facet tag',
        createdAt: '2024-06-15T14:00:00.000Z',
        facets: [
          {
            index: { byteStart: 0, byteEnd: 4 },
            features: [
              { $type: 'app.bsky.richtext.facet#tag', tag: 'crypto' },
            ],
          },
        ],
      },
      indexedAt: '2024-06-15T14:00:01.000Z',
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
    },
  },
  {
    post: {
      uri: 'at://did:plc:other999/app.bsky.feed.post/rkey_other',
      cid: 'cid_other',
      author: {
        did: 'did:plc:other999',
        handle: 'bob.bsky.social',
        displayName: 'Bob',
      },
      record: {
        $type: 'app.bsky.feed.post',
        text: 'This is a repost by someone else in the feed',
        createdAt: '2024-06-15T15:00:00.000Z',
      },
      indexedAt: '2024-06-15T15:00:01.000Z',
      likeCount: 10,
      repostCount: 5,
      replyCount: 3,
    },
  },
]

export const followsList: AppBskyActorDefs.ProfileView[] = [
  {
    did: 'did:plc:follow001',
    handle: 'bob.bsky.social',
    displayName: 'Bob',
  },
  {
    did: 'did:plc:follow002',
    handle: 'carol.bsky.social',
    displayName: 'Carol',
  },
  {
    did: 'did:plc:follow003',
    handle: 'dave.bsky.social',
  },
]
