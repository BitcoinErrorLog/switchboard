import * as nip19 from 'nostr-tools/nip19'

export interface DecodedIdentity {
  hexPubkey: string
  relayHints: string[]
}

const HEX_REGEX = /^[0-9a-f]{64}$/i

export function decodeNostrIdentifier(input: string): DecodedIdentity {
  const trimmed = input.trim()

  if (HEX_REGEX.test(trimmed)) {
    return { hexPubkey: trimmed.toLowerCase(), relayHints: [] }
  }

  const decoded = nip19.decode(trimmed)

  switch (decoded.type) {
    case 'npub':
      return { hexPubkey: decoded.data, relayHints: [] }
    case 'nprofile':
      return {
        hexPubkey: decoded.data.pubkey,
        relayHints: decoded.data.relays ?? [],
      }
    default:
      throw new Error(`Unsupported Nostr identifier type: ${decoded.type}`)
  }
}

export function hasNip07Extension(): boolean {
  return typeof window !== 'undefined' && !!window.nostr
}

export async function getNip07PublicKey(): Promise<string> {
  if (!window.nostr) {
    throw new Error('No NIP-07 browser extension found')
  }
  return window.nostr.getPublicKey()
}

export async function verifyOwnershipViaNip07(hexPubkey: string): Promise<{
  verified: boolean
  proof: string | null
}> {
  if (!window.nostr) {
    return { verified: false, proof: null }
  }

  const extensionPubkey = await window.nostr.getPublicKey()
  if (extensionPubkey !== hexPubkey) {
    return { verified: false, proof: null }
  }

  const challengeEvent = {
    kind: 22242,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['challenge', crypto.randomUUID()]],
    content: 'Switchboard ownership verification',
  }

  const signedEvent = await window.nostr.signEvent(challengeEvent)

  if (signedEvent.pubkey === hexPubkey && signedEvent.sig) {
    return { verified: true, proof: signedEvent.sig }
  }

  return { verified: false, proof: null }
}
