import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuthorizationUrl = 'pubkyauth://test-relay/abc123'
const mockSession = { info: { publicKey: { z32: () => 'pk1testpubkyid' } }, storage: { putJson: vi.fn() } }

const mockAuthFlow = {
  authorizationUrl: mockAuthorizationUrl,
  awaitApproval: vi.fn().mockResolvedValue(mockSession),
}

vi.mock('@synonymdev/pubky', () => {
  const instance = {
    startAuthFlow: vi.fn().mockReturnValue(mockAuthFlow),
    signer: vi.fn(),
  }

  function MockPubky() {
    return instance
  }

  return {
    Pubky: MockPubky,
    Keypair: { fromSecret: vi.fn() },
    PublicKey: { from: vi.fn() },
    AuthFlowKind: {
      signin: vi.fn().mockReturnValue({ kind: 'signin' }),
      signup: vi.fn(),
    },
  }
})

vi.mock('bip39', () => ({
  generateMnemonic: vi.fn().mockReturnValue('word '.repeat(23) + 'word'),
  mnemonicToSeedSync: vi.fn().mockReturnValue(new Uint8Array(64)),
}))

describe('signinWithAuthFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an authorization URL and awaitApproval callback', async () => {
    const { signinWithAuthFlow } = await import('./pubky')

    const result = await signinWithAuthFlow()

    expect(result.authorizationUrl).toBe(mockAuthorizationUrl)
    expect(typeof result.awaitApproval).toBe('function')
  })

  it('awaitApproval resolves with session and pubkyId', async () => {
    const { signinWithAuthFlow } = await import('./pubky')

    const result = await signinWithAuthFlow()
    const { session, pubkyId } = await result.awaitApproval()

    expect(session).toBe(mockSession)
    expect(pubkyId).toBe('pk1testpubkyid')
  })

  it('starts an auth flow and returns a valid authorization URL', async () => {
    const { signinWithAuthFlow } = await import('./pubky')

    const result = await signinWithAuthFlow()

    expect(result.authorizationUrl).toContain('pubkyauth://')
  })
})
