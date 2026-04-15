export type PlatformId =
  | 'nostr'
  | 'bluesky'
  | 'x'
  | 'mastodon'
  | 'threads'
  | 'reddit'
  | 'tumblr'
  | 'pinterest'
  | 'instagram'
  | 'stacker'
  | 'hn'
  | 'farcaster'
  | 'lens'

export type VerificationState = 'claimed' | 'verified' | 'unverified'

export interface SwitchboardIdentity {
  platform: PlatformId
  external_id: string
  handle: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  profile_url: string | null
  links: string[]
  verification_state: VerificationState
  ownership_proof: string | null
  import_source: string
  created_at: number
  updated_at: number
}

export interface SwitchboardObject {
  platform: PlatformId
  external_id: string
  canonical_object_id: string
  author_identity_ref: string
  kind: string
  body: string
  media_refs: string[]
  canonical_url: string | null
  created_at: number
  updated_at: number
  visibility: string
  reply_to: string | null
  quote_of: string | null
  repost_of: string | null
  tags: string[]
  source_payload_ref: string
}

export type EdgeKind =
  | 'follows'
  | 'replies_to'
  | 'mentions'
  | 'reposts'
  | 'quotes'
  | 'belongs_to_collection'
  | 'appears_in_list'
  | 'pinned_to_board'
  | 'reblogs'

export interface SwitchboardEdge {
  source_ref: string
  target_ref: string
  edge_kind: EdgeKind
  platform: PlatformId
  created_at: number
  metadata: Record<string, unknown>
}

export type SignalKind =
  | 'like'
  | 'upvote'
  | 'bookmark'
  | 'repost_count'
  | 'zap_amount'
  | 'reaction'

export interface SwitchboardSignal {
  subject_ref: string
  actor_ref: string
  signal_kind: SignalKind
  platform: PlatformId
  numeric_value: number | null
  created_at: number
  metadata: Record<string, unknown>
}

export type CollectionKind =
  | 'board'
  | 'blog'
  | 'list'
  | 'subreddit'
  | 'playlist'
  | 'channel'

export interface SwitchboardCollection {
  collection_id: string
  owner_ref: string
  platform: PlatformId
  external_id: string
  kind: CollectionKind
  title: string
  description: string | null
  members: string[]
  created_at: number
  updated_at: number
}

export interface SwitchboardCheckpoint {
  platform: PlatformId
  scope: string
  cursor: number | null
  since_token: number | null
  last_success_at: number
  backfill_watermark: number | null
  relay_state: {
    relays_queried: string[]
    last_query_at: number
  }
  metadata: Record<string, unknown>
}
