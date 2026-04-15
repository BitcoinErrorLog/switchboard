import { describe, it, expect, beforeEach } from 'vitest'
import { registerLink, lookupPubkyId, seedLinks, getAllLinks, clearLinks } from './identity-links'

describe('identity-links', () => {
  beforeEach(() => {
    clearLinks()
  })

  it('registers and looks up a link', () => {
    registerLink('nostr', 'hex_pubkey_001', 'pubky_id_001')
    expect(lookupPubkyId('nostr', 'hex_pubkey_001')).toBe('pubky_id_001')
  })

  it('returns null for unknown link', () => {
    expect(lookupPubkyId('nostr', 'unknown')).toBeNull()
  })

  it('returns null for wrong platform', () => {
    registerLink('nostr', 'hex_pubkey_001', 'pubky_id_001')
    expect(lookupPubkyId('bluesky', 'hex_pubkey_001')).toBeNull()
  })

  it('seeds multiple links', () => {
    seedLinks([
      { platform: 'nostr', externalId: 'a', pubkyId: 'pa' },
      { platform: 'bluesky', externalId: 'b', pubkyId: 'pb' },
    ])
    expect(lookupPubkyId('nostr', 'a')).toBe('pa')
    expect(lookupPubkyId('bluesky', 'b')).toBe('pb')
  })

  it('getAllLinks returns a copy', () => {
    registerLink('nostr', 'x', 'px')
    const all = getAllLinks()
    expect(all.size).toBe(1)
    all.delete('nostr:x')
    expect(lookupPubkyId('nostr', 'x')).toBe('px')
  })

  it('clearLinks empties the store', () => {
    registerLink('nostr', 'x', 'px')
    clearLinks()
    expect(lookupPubkyId('nostr', 'x')).toBeNull()
    expect(getAllLinks().size).toBe(0)
  })

  it('overwrites existing link', () => {
    registerLink('nostr', 'x', 'old')
    registerLink('nostr', 'x', 'new')
    expect(lookupPubkyId('nostr', 'x')).toBe('new')
  })
})
