import type {
  PlatformId,
  SwitchboardIdentity,
  SwitchboardObject,
  SwitchboardEdge,
  SwitchboardSignal,
  SwitchboardCheckpoint,
} from './types'

export interface CapabilityManifest {
  claim_identity: boolean
  verify_ownership: boolean
  archive_import: boolean
  live_sync: boolean
  publish: boolean
  reply_publish: boolean
  delete_publish: boolean
  graph_import: boolean
  media_import: boolean
  webhooks: boolean
  oauth: boolean
  official_export: boolean
  scraping: boolean
  read_only: boolean
}

export interface ClaimInput {
  raw_identifier: string
}

export interface ClaimResult {
  identity: SwitchboardIdentity
  relay_hints?: string[]
}

export interface VerifyInput {
  identity: SwitchboardIdentity
}

export interface VerifyResult {
  verified: boolean
  proof: string | null
  identity: SwitchboardIdentity
}

export interface BackfillInput {
  identity: SwitchboardIdentity
  relay_hints?: string[]
  limit?: number
}

export interface BackfillJobResult {
  objects: SwitchboardObject[]
  edges: SwitchboardEdge[]
  signals: SwitchboardSignal[]
  checkpoint: SwitchboardCheckpoint | null
  tag_frequencies: Map<string, number>
}

export interface GraphFetchInput {
  identity: SwitchboardIdentity
}

export interface GraphResult {
  edges: SwitchboardEdge[]
}

export interface PublishInput {
  content: string
  identity: SwitchboardIdentity
}

export interface PublishResult {
  success: boolean
  external_id: string | null
  url: string | null
}

export interface BridgeAdapter {
  platform(): PlatformId
  capabilities(): CapabilityManifest

  claimIdentity(input: ClaimInput): Promise<ClaimResult>
  verifyOwnership(input: VerifyInput): Promise<VerifyResult>
  backfill(input: BackfillInput): Promise<BackfillJobResult>
  fetchGraph?(input: GraphFetchInput): Promise<GraphResult>
  publish(input: PublishInput): Promise<PublishResult>
}
