import { finalizeEvent, getPublicKey as getNostrPublicKey } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import type { EventTemplate, VerifiedEvent } from 'nostr-tools/core'

let storedSecretKey: Uint8Array | null = null

const HEX_64_REGEX = /^[0-9a-f]{64}$/i

export function decodeNsec(input: string): { secretKey: Uint8Array; hexPubkey: string } {
  const trimmed = input.trim()

  if (HEX_64_REGEX.test(trimmed)) {
    const bytes = hexToBytes(trimmed)
    return { secretKey: bytes, hexPubkey: getNostrPublicKey(bytes) }
  }

  if (trimmed.startsWith('nsec1')) {
    const decoded = nip19.decode(trimmed)
    if (decoded.type !== 'nsec') {
      throw new Error('Invalid nsec format')
    }
    return { secretKey: decoded.data, hexPubkey: getNostrPublicKey(decoded.data) }
  }

  throw new Error('Expected an nsec or 64-character hex private key')
}

export function setSecretKey(key: Uint8Array) {
  storedSecretKey = key
}

export function clearSecretKey() {
  storedSecretKey = null
}

export function hasSecretKey(): boolean {
  return storedSecretKey !== null
}

export function getStoredPublicKey(): string | null {
  if (!storedSecretKey) return null
  return getNostrPublicKey(storedSecretKey)
}

export function secretKeyToHex(key: Uint8Array): string {
  return Array.from(key).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

export async function signEvent(template: EventTemplate): Promise<VerifiedEvent> {
  if (storedSecretKey) {
    return finalizeEvent(template, storedSecretKey)
  }

  if (window.nostr) {
    const signed = await window.nostr.signEvent({
      kind: template.kind,
      created_at: template.created_at,
      tags: template.tags,
      content: template.content,
    })
    return signed as unknown as VerifiedEvent
  }

  throw new Error('No signing method available. Add your nsec or install a NIP-07 extension.')
}

export function canSign(): boolean {
  return storedSecretKey !== null || (typeof window !== 'undefined' && !!window.nostr)
}

export function loadSecretKeyFromHex(hex: string) {
  storedSecretKey = hexToBytes(hex)
}
