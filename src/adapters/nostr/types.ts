export interface NostrProfileContent {
  name?: string
  about?: string
  picture?: string
  display_name?: string
  website?: string
  banner?: string
  nip05?: string
  lud16?: string
}

export interface NostrEvent {
  id: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig: string
}

export interface RelayInfo {
  url: string
  access: 'read' | 'write' | 'both'
}

export interface WindowNostr {
  getPublicKey(): Promise<string>
  signEvent(event: UnsignedNostrEvent): Promise<NostrEvent>
}

export interface UnsignedNostrEvent {
  kind: number
  created_at: number
  tags: string[][]
  content: string
}

declare global {
  interface Window {
    nostr?: WindowNostr
  }
}
