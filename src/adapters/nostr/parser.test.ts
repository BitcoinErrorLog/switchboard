import { describe, it, expect } from 'vitest'
import { parseProfile, parseNotes, parseFollows, extractTagFrequencies } from './parser'
import {
  profileEvent,
  profileEventMalformed,
  profileEventEmpty,
  noteEvents,
  noteEventEmpty,
  contactListEvent,
} from '@/fixtures/nostr/events'

describe('parseProfile', () => {
  it('parses a valid profile event', () => {
    const identity = parseProfile(profileEvent)
    expect(identity.platform).toBe('nostr')
    expect(identity.external_id).toBe(profileEvent.pubkey)
    expect(identity.display_name).toBe('Alice')
    expect(identity.bio).toBe('Nostr enthusiast')
    expect(identity.avatar_url).toBe('https://example.com/avatar.jpg')
    expect(identity.profile_url).toBe('https://alice.example.com')
    expect(identity.handle).toBe('alice@example.com')
    expect(identity.verification_state).toBe('claimed')
    expect(identity.links).toEqual(['https://alice.example.com'])
  })

  it('handles malformed JSON gracefully', () => {
    const identity = parseProfile(profileEventMalformed)
    expect(identity.platform).toBe('nostr')
    expect(identity.display_name).toBeNull()
    expect(identity.bio).toBeNull()
    expect(identity.avatar_url).toBeNull()
  })

  it('handles empty profile fields', () => {
    const identity = parseProfile(profileEventEmpty)
    expect(identity.display_name).toBeNull()
    expect(identity.bio).toBeNull()
    expect(identity.handle).toBeNull()
    expect(identity.links).toEqual([])
  })
})

describe('parseNotes', () => {
  it('parses note events into SwitchboardObjects', () => {
    const objects = parseNotes(noteEvents)
    expect(objects).toHaveLength(3)
    expect(objects[0].body).toBe('Hello world from Nostr!')
    expect(objects[0].kind).toBe('note')
    expect(objects[0].platform).toBe('nostr')
    expect(objects[0].canonical_object_id).toBe('nostr:note001')
  })

  it('extracts hashtags and strips # prefix', () => {
    const objects = parseNotes(noteEvents)
    expect(objects[0].tags).toContain('bitcoin')
    expect(objects[0].tags).toContain('nostr')
    expect(objects[0].tags).not.toContain('#nostr')
  })

  it('extracts reply_to from NIP-10 reply marker', () => {
    const objects = parseNotes(noteEvents)
    expect(objects[1].reply_to).toBe('parent_event_id')
  })

  it('falls back to last e tag for reply_to', () => {
    const objects = parseNotes(noteEvents)
    expect(objects[2].reply_to).toBe('parent_event_id_2')
  })

  it('returns empty array for empty events', () => {
    const objects = parseNotes([])
    expect(objects).toHaveLength(0)
  })

  it('handles empty content notes', () => {
    const objects = parseNotes([noteEventEmpty])
    expect(objects).toHaveLength(1)
    expect(objects[0].body).toBe('')
  })
})

describe('parseFollows', () => {
  it('parses follow edges from contact list', () => {
    const edges = parseFollows(contactListEvent, contactListEvent.pubkey)
    expect(edges).toHaveLength(3)
    expect(edges[0].edge_kind).toBe('follows')
    expect(edges[0].source_ref).toBe(contactListEvent.pubkey)
    expect(edges[0].target_ref).toBe('follow1_pubkey_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    expect(edges[0].metadata).toEqual({ relay_hint: 'wss://relay.example.com' })
  })

  it('handles follow without relay hint', () => {
    const edges = parseFollows(contactListEvent, contactListEvent.pubkey)
    expect(edges[1].metadata).toEqual({})
  })
})

describe('extractTagFrequencies', () => {
  it('counts tag frequencies across objects', () => {
    const objects = parseNotes(noteEvents)
    const freq = extractTagFrequencies(objects)
    expect(freq.get('bitcoin')).toBe(1)
    expect(freq.get('nostr')).toBe(1)
  })

  it('returns empty map for no objects', () => {
    const freq = extractTagFrequencies([])
    expect(freq.size).toBe(0)
  })
})
