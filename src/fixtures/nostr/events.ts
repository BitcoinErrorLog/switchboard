import type { Event } from 'nostr-tools/core'

export const profileEvent: Event = {
  id: 'aaa111',
  pubkey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  created_at: 1700000000,
  kind: 0,
  tags: [],
  content: JSON.stringify({
    name: 'alice',
    display_name: 'Alice',
    about: 'Nostr enthusiast',
    picture: 'https://example.com/avatar.jpg',
    website: 'https://alice.example.com',
    nip05: 'alice@example.com',
  }),
  sig: 'sig_placeholder',
}

export const profileEventMalformed: Event = {
  id: 'aaa222',
  pubkey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  created_at: 1700000000,
  kind: 0,
  tags: [],
  content: '{invalid json!!!',
  sig: 'sig_placeholder',
}

export const profileEventEmpty: Event = {
  id: 'aaa333',
  pubkey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  created_at: 1700000000,
  kind: 0,
  tags: [],
  content: JSON.stringify({}),
  sig: 'sig_placeholder',
}

export const noteEvents: Event[] = [
  {
    id: 'note001',
    pubkey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    created_at: 1700001000,
    kind: 1,
    tags: [
      ['t', 'bitcoin'],
      ['t', '#nostr'],
    ],
    content: 'Hello world from Nostr!',
    sig: 'sig_placeholder',
  },
  {
    id: 'note002',
    pubkey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    created_at: 1700002000,
    kind: 1,
    tags: [
      ['e', 'parent_event_id', '', 'reply'],
      ['p', 'other_pubkey_111'],
    ],
    content: 'This is a reply to another note',
    sig: 'sig_placeholder',
  },
  {
    id: 'note003',
    pubkey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    created_at: 1700003000,
    kind: 1,
    tags: [
      ['e', 'root_event_id'],
      ['e', 'parent_event_id_2'],
    ],
    content: 'A note with multiple e tags (NIP-10 positional)',
    sig: 'sig_placeholder',
  },
]

export const noteEventEmpty: Event = {
  id: 'note004',
  pubkey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  created_at: 1700004000,
  kind: 1,
  tags: [],
  content: '',
  sig: 'sig_placeholder',
}

export const contactListEvent: Event = {
  id: 'contacts001',
  pubkey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  created_at: 1700000500,
  kind: 3,
  tags: [
    ['p', 'follow1_pubkey_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'wss://relay.example.com'],
    ['p', 'follow2_pubkey_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'],
    ['p', 'follow3_pubkey_cccccccccccccccccccccccccccccccccccccccccccccccc', 'wss://relay2.example.com'],
  ],
  content: '',
  sig: 'sig_placeholder',
}

export const relayListEvent: Event = {
  id: 'relay001',
  pubkey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  created_at: 1700000100,
  kind: 10002,
  tags: [
    ['r', 'wss://relay.damus.io'],
    ['r', 'wss://nos.lol', 'read'],
    ['r', 'wss://relay.primal.net', 'write'],
  ],
  content: '',
  sig: 'sig_placeholder',
}
