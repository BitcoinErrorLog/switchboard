import type {
  BridgeAdapter,
  CapabilityManifest,
  ClaimInput,
  ClaimResult,
  VerifyInput,
  VerifyResult,
  BackfillInput,
  BackfillJobResult,
  GraphFetchInput,
  GraphResult,
  PublishInput,
  PublishResult,
} from '@/core/adapter'
import type { PlatformId } from '@/core/types'
import { decodeNostrIdentifier } from './identity'
import { verifyOwnershipViaNip07 } from './identity'
import { fetchUserData } from './client'
import { parseProfile, parseNotes, parseFollows, extractTagFrequencies } from './parser'
import { parseRelayListEvent, getWriteRelays } from './relays'
import { publishAnnouncement } from './publisher'

export class NostrAdapter implements BridgeAdapter {
  platform(): PlatformId {
    return 'nostr'
  }

  capabilities(): CapabilityManifest {
    return {
      claim_identity: true,
      verify_ownership: true,
      archive_import: false,
      live_sync: false,
      publish: true,
      reply_publish: false,
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

  async claimIdentity(input: ClaimInput): Promise<ClaimResult> {
    const { hexPubkey, relayHints } = decodeNostrIdentifier(input.raw_identifier)

    const data = await fetchUserData(hexPubkey, 1)

    const identity = data.profile
      ? parseProfile(data.profile)
      : {
          platform: 'nostr' as const,
          external_id: hexPubkey,
          handle: null,
          display_name: null,
          bio: null,
          avatar_url: null,
          profile_url: null,
          links: [],
          verification_state: 'claimed' as const,
          ownership_proof: null,
          import_source: 'relay',
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        }

    return { identity, relay_hints: relayHints }
  }

  async verifyOwnership(input: VerifyInput): Promise<VerifyResult> {
    const result = await verifyOwnershipViaNip07(input.identity.external_id)
    return {
      verified: result.verified,
      proof: result.proof,
      identity: {
        ...input.identity,
        verification_state: result.verified ? 'verified' : input.identity.verification_state,
        ownership_proof: result.proof,
      },
    }
  }

  async backfill(input: BackfillInput): Promise<BackfillJobResult> {
    const data = await fetchUserData(
      input.identity.external_id,
      input.limit ?? 200,
    )

    const objects = data.notes ? parseNotes(data.notes) : []
    const edges = data.contacts
      ? parseFollows(data.contacts, input.identity.external_id)
      : []

    const tagFrequencies = extractTagFrequencies(objects)

    let checkpoint = null
    if (data.relayList) {
      const infos = parseRelayListEvent(data.relayList.tags)
      checkpoint = {
        platform: 'nostr' as const,
        scope: input.identity.external_id,
        cursor: null,
        since_token: null,
        last_success_at: Math.floor(Date.now() / 1000),
        backfill_watermark: null,
        relay_state: {
          relays_queried: infos.map((r) => r.url),
          last_query_at: Math.floor(Date.now() / 1000),
        },
        metadata: {},
      }
    }

    return {
      objects,
      edges,
      signals: [],
      checkpoint,
      tag_frequencies: tagFrequencies,
    }
  }

  async fetchGraph(input: GraphFetchInput): Promise<GraphResult> {
    const data = await fetchUserData(input.identity.external_id, 0)
    const edges = data.contacts
      ? parseFollows(data.contacts, input.identity.external_id)
      : []
    return { edges }
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const data = await fetchUserData(input.identity.external_id, 0)
    let writeRelays: string[] | undefined
    if (data.relayList) {
      const infos = parseRelayListEvent(data.relayList.tags)
      writeRelays = getWriteRelays(infos)
    }

    const result = await publishAnnouncement(input.content, writeRelays)
    return {
      success: result.success,
      external_id: result.eventId,
      url: result.eventId ? `https://njump.me/${result.eventId}` : null,
    }
  }
}
