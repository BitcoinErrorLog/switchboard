import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  decodeNsec,
  setSecretKey,
  clearSecretKey,
  hasSecretKey,
  getStoredPublicKey,
  secretKeyToHex,
  hexToBytes,
  signEvent,
  canSign,
  loadSecretKeyFromHex,
} from './signer'

vi.mock('nostr-tools/pure', () => {
  const knownKey = '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
  const knownPubkey = 'deadbeef' + '00'.repeat(28)

  return {
    getPublicKey: (sk: Uint8Array) => {
      const hex = Array.from(sk).map((b) => b.toString(16).padStart(2, '0')).join('')
      if (hex === knownKey) return knownPubkey
      return 'derived_pubkey_' + hex.slice(0, 8)
    },
    finalizeEvent: (template: unknown, _sk: Uint8Array) => ({
      ...(template as Record<string, unknown>),
      id: 'event_id_123',
      pubkey: knownPubkey,
      sig: 'sig_abc',
    }),
  }
})

vi.mock('nostr-tools/nip19', () => ({
  decode: (input: string) => {
    if (input.startsWith('nsec1')) {
      return {
        type: 'nsec',
        data: new Uint8Array(32).fill(0x42),
      }
    }
    throw new Error('invalid nip19')
  },
}))

describe('signer', () => {
  beforeEach(() => {
    clearSecretKey()
    delete (window as any).nostr
  })

  describe('decodeNsec', () => {
    it('decodes a 64-char hex private key', () => {
      const hex = '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
      const result = decodeNsec(hex)
      expect(result.secretKey).toBeInstanceOf(Uint8Array)
      expect(result.secretKey.length).toBe(32)
      expect(result.hexPubkey).toBeTruthy()
    })

    it('decodes an nsec1 bech32 key', () => {
      const result = decodeNsec('nsec1abc')
      expect(result.secretKey).toBeInstanceOf(Uint8Array)
      expect(result.hexPubkey).toBeTruthy()
    })

    it('trims whitespace', () => {
      const hex = '  0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20  '
      const result = decodeNsec(hex)
      expect(result.secretKey.length).toBe(32)
    })

    it('throws on invalid input', () => {
      expect(() => decodeNsec('not_valid')).toThrow('Expected an nsec or 64-character hex private key')
    })
  })

  describe('key management', () => {
    it('starts with no secret key', () => {
      expect(hasSecretKey()).toBe(false)
      expect(getStoredPublicKey()).toBeNull()
    })

    it('stores and retrieves a secret key', () => {
      const key = new Uint8Array(32).fill(0x01)
      setSecretKey(key)
      expect(hasSecretKey()).toBe(true)
      expect(getStoredPublicKey()).toBeTruthy()
    })

    it('clears secret key', () => {
      setSecretKey(new Uint8Array(32).fill(0x01))
      clearSecretKey()
      expect(hasSecretKey()).toBe(false)
      expect(getStoredPublicKey()).toBeNull()
    })
  })

  describe('hexToBytes / secretKeyToHex', () => {
    it('roundtrips correctly', () => {
      const original = new Uint8Array([1, 2, 255, 0, 128])
      const hex = secretKeyToHex(original)
      const restored = hexToBytes(hex)
      expect(restored).toEqual(original)
    })
  })

  describe('loadSecretKeyFromHex', () => {
    it('loads key from hex and makes it available', () => {
      const hex = '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
      loadSecretKeyFromHex(hex)
      expect(hasSecretKey()).toBe(true)
      expect(getStoredPublicKey()).toBeTruthy()
    })
  })

  describe('signEvent', () => {
    it('signs with stored secret key', async () => {
      setSecretKey(new Uint8Array(32).fill(0x01))
      const result = await signEvent({
        kind: 1,
        created_at: 1234567890,
        tags: [],
        content: 'hello',
      })
      expect(result.id).toBe('event_id_123')
      expect(result.sig).toBe('sig_abc')
    })

    it('falls back to NIP-07 when no secret key', async () => {
      const mockSigned = { id: 'nip07_id', pubkey: 'abc', sig: 'nip07_sig', kind: 1, created_at: 0, tags: [], content: '' }
      ;(window as any).nostr = { signEvent: vi.fn().mockResolvedValue(mockSigned) }

      const result = await signEvent({
        kind: 1,
        created_at: 1234567890,
        tags: [],
        content: 'test',
      })
      expect(result.id).toBe('nip07_id')
    })

    it('throws when no signing method is available', async () => {
      await expect(
        signEvent({ kind: 1, created_at: 0, tags: [], content: '' }),
      ).rejects.toThrow('No signing method available')
    })
  })

  describe('canSign', () => {
    it('returns true when secret key is stored', () => {
      setSecretKey(new Uint8Array(32).fill(0x01))
      expect(canSign()).toBe(true)
    })

    it('returns true when NIP-07 extension is present', () => {
      ;(window as any).nostr = { getPublicKey: vi.fn() }
      expect(canSign()).toBe(true)
    })

    it('returns false when neither is available', () => {
      expect(canSign()).toBe(false)
    })
  })
})
