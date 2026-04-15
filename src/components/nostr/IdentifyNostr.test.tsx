import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IdentifyNostr from './IdentifyNostr'
import { useImportStore } from '@/stores/import'

vi.mock('@/platforms', () => ({
  getPlatformConfig: vi.fn().mockReturnValue({
    adapter: {
      claimIdentity: vi.fn().mockResolvedValue({
        identity: {
          platform: 'nostr',
          external_id: 'hex123',
          handle: null,
          display_name: 'Test User',
          bio: null,
          avatar_url: null,
          profile_url: null,
          links: [],
          verification_state: 'claimed',
          ownership_proof: null,
          import_source: 'relay',
          created_at: 1700000000,
          updated_at: 1700000000,
        },
      }),
      verifyOwnership: vi.fn().mockResolvedValue({
        verified: true,
        proof: 'sig_proof',
        identity: {
          platform: 'nostr',
          external_id: 'hex123',
          handle: null,
          display_name: 'Test User',
          bio: null,
          avatar_url: null,
          profile_url: null,
          links: [],
          verification_state: 'verified',
          ownership_proof: 'sig_proof',
          import_source: 'relay',
          created_at: 1700000000,
          updated_at: 1700000000,
        },
      }),
    },
  }),
}))

vi.mock('@/adapters/nostr/identity', () => ({
  hasNip07Extension: vi.fn().mockReturnValue(false),
  generateVerificationCode: vi.fn().mockReturnValue('switchboard-verify-abc123def456'),
  checkVerificationPost: vi.fn().mockResolvedValue(false),
}))

describe('IdentifyNostr', () => {
  beforeEach(() => {
    useImportStore.getState().reset()
  })

  it('renders npub input field', () => {
    render(<IdentifyNostr />)
    expect(screen.getByPlaceholderText('npub1... or hex pubkey')).toBeInTheDocument()
  })

  it('renders look up button', () => {
    render(<IdentifyNostr />)
    expect(screen.getByText('Look Up')).toBeInTheDocument()
  })

  it('renders connect with extension button', () => {
    render(<IdentifyNostr />)
    expect(screen.getByText('⚡ Connect with Nostr Extension')).toBeInTheDocument()
  })

  it('disables look up button when input is empty', () => {
    render(<IdentifyNostr />)
    expect(screen.getByText('Look Up')).toBeDisabled()
  })

  it('shows verification UI after claiming identity', async () => {
    const user = userEvent.setup()
    render(<IdentifyNostr />)

    const input = screen.getByPlaceholderText('npub1... or hex pubkey')
    await user.type(input, 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789')
    await user.click(screen.getByText('Look Up'))

    expect(await screen.findByText('Verify Ownership')).toBeInTheDocument()
  })

  it('shows NIP-07 extension message', () => {
    render(<IdentifyNostr />)
    expect(screen.getByText(/NIP-07 browser extension/)).toBeInTheDocument()
  })
})
