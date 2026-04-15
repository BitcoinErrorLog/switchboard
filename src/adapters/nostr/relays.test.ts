import { describe, it, expect } from 'vitest'
import { parseRelayListEvent, getWriteRelays, getReadRelays } from './relays'

describe('parseRelayListEvent', () => {
  it('parses relay list tags', () => {
    const tags = [
      ['r', 'wss://relay.damus.io'],
      ['r', 'wss://nos.lol', 'read'],
      ['r', 'wss://relay.primal.net', 'write'],
    ]
    const infos = parseRelayListEvent(tags)
    expect(infos).toHaveLength(3)
    expect(infos[0]).toEqual({ url: 'wss://relay.damus.io', access: 'both' })
    expect(infos[1]).toEqual({ url: 'wss://nos.lol', access: 'read' })
    expect(infos[2]).toEqual({ url: 'wss://relay.primal.net', access: 'write' })
  })

  it('skips non-r tags', () => {
    const tags = [
      ['p', 'some_pubkey'],
      ['r', 'wss://relay.damus.io'],
    ]
    const infos = parseRelayListEvent(tags)
    expect(infos).toHaveLength(1)
  })

  it('skips r tags without URL', () => {
    const tags = [['r']]
    const infos = parseRelayListEvent(tags)
    expect(infos).toHaveLength(0)
  })

  it('returns empty array for empty tags', () => {
    const infos = parseRelayListEvent([])
    expect(infos).toHaveLength(0)
  })
})

describe('getWriteRelays', () => {
  it('returns write and both relays', () => {
    const infos = [
      { url: 'wss://a.com', access: 'both' as const },
      { url: 'wss://b.com', access: 'read' as const },
      { url: 'wss://c.com', access: 'write' as const },
    ]
    const result = getWriteRelays(infos)
    expect(result).toEqual(['wss://a.com', 'wss://c.com'])
  })
})

describe('getReadRelays', () => {
  it('returns read and both relays', () => {
    const infos = [
      { url: 'wss://a.com', access: 'both' as const },
      { url: 'wss://b.com', access: 'read' as const },
      { url: 'wss://c.com', access: 'write' as const },
    ]
    const result = getReadRelays(infos)
    expect(result).toEqual(['wss://a.com', 'wss://b.com'])
  })
})
