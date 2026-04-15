import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@synonymdev/pubky', () => ({
  Keypair: {
    fromSecret: vi.fn().mockReturnValue({
      publicKey: { z32: () => 'pk1testuser' },
    }),
  },
}))

vi.mock('./pubky', () => {
  const session = {
    info: { publicKey: { z32: () => 'pk1testuser' } },
    storage: { putJson: vi.fn() },
  }
  const mockSigner = { signin: vi.fn().mockResolvedValue(session) }
  const mockPubkyInstance = { signer: vi.fn().mockReturnValue(mockSigner) }

  return {
    getPubky: vi.fn().mockReturnValue(mockPubkyInstance),
    keypairFromMnemonic: vi.fn().mockReturnValue({
      keypair: { publicKey: { z32: () => 'pk1testuser' } },
      pubkyId: 'pk1testuser',
    }),
    getPublicKey: vi.fn().mockReturnValue('pk1testuser'),
  }
})

import {
  persistMnemonicSession,
  persistAuthFlowSession,
  setCachedSession,
  getSession,
  hasPersisted,
  getPersistedPubkyId,
  clearSession,
} from './pubky-session'

function makeMockSession() {
  return {
    info: { publicKey: { z32: () => 'pk1testuser' } },
    storage: { putJson: vi.fn() },
  } as any
}

describe('pubky-session', () => {
  beforeEach(() => {
    clearSession()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('persistMnemonicSession', () => {
    it('stores mnemonic in localStorage', () => {
      persistMnemonicSession('test mnemonic words', 'pk1abc')

      const stored = JSON.parse(localStorage.getItem('switchboard_pubky_credentials')!)
      expect(stored.method).toBe('mnemonic')
      expect(stored.mnemonic).toBe('test mnemonic words')
      expect(stored.pubkyId).toBe('pk1abc')
    })
  })

  describe('hasPersisted', () => {
    it('returns false with no session', () => {
      expect(hasPersisted()).toBe(false)
    })

    it('returns true after persisting mnemonic', () => {
      persistMnemonicSession('test mnemonic', 'pk1abc')
      expect(hasPersisted()).toBe(true)
    })

    it('returns true with cached session', () => {
      setCachedSession(makeMockSession(), 'pk1abc')
      expect(hasPersisted()).toBe(true)
    })
  })

  describe('getPersistedPubkyId', () => {
    it('returns null with no session', () => {
      expect(getPersistedPubkyId()).toBeNull()
    })

    it('returns pubkyId from persisted session', () => {
      persistMnemonicSession('test mnemonic', 'pk1abc')
      expect(getPersistedPubkyId()).toBe('pk1abc')
    })

    it('returns pubkyId from cached session', () => {
      setCachedSession(makeMockSession(), 'pk1cached')
      expect(getPersistedPubkyId()).toBe('pk1cached')
    })
  })

  describe('getSession', () => {
    it('returns null with no session', async () => {
      const result = await getSession()
      expect(result).toBeNull()
    })

    it('returns cached session without re-signing-in', async () => {
      const session = makeMockSession()
      setCachedSession(session, 'pk1cached')

      const result = await getSession()
      expect(result).not.toBeNull()
      expect(result!.pubkyId).toBe('pk1cached')
      expect(result!.session).toBe(session)
    })

    it('restores session from persisted mnemonic', async () => {
      persistMnemonicSession('test mnemonic words here', 'pk1mnemonic')

      const result = await getSession()
      expect(result).not.toBeNull()
      expect(result!.pubkyId).toBe('pk1testuser')
    })

    it('returns null for authflow-only persistence without cache', async () => {
      localStorage.setItem(
        'switchboard_pubky_credentials',
        JSON.stringify({ pubkyId: 'pk1auth', method: 'authflow' }),
      )

      const result = await getSession()
      expect(result).toBeNull()
    })
  })

  describe('persistAuthFlowSession', () => {
    it('caches session in memory and persists metadata', () => {
      persistAuthFlowSession(makeMockSession(), 'pk1auth')

      expect(hasPersisted()).toBe(true)
      expect(getPersistedPubkyId()).toBe('pk1auth')
    })

    it('session is available via getSession', async () => {
      const session = makeMockSession()
      persistAuthFlowSession(session, 'pk1auth')

      const result = await getSession()
      expect(result).not.toBeNull()
      expect(result!.session).toBe(session)
    })
  })

  describe('clearSession', () => {
    it('clears both cache and storage', () => {
      persistMnemonicSession('test', 'pk1test')
      setCachedSession(makeMockSession(), 'pk1test')

      clearSession()

      expect(hasPersisted()).toBe(false)
      expect(getPersistedPubkyId()).toBeNull()
      expect(localStorage.getItem('switchboard_pubky_credentials')).toBeNull()
    })
  })
})
