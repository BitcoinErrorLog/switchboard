import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IdentifyBluesky from './IdentifyBluesky'
import { useImportStore } from '@/stores/import'

vi.mock('@/platforms', () => ({
  getPlatformConfig: vi.fn().mockReturnValue({
    adapter: {
      setCredentials: vi.fn(),
      claimIdentity: vi.fn().mockResolvedValue({
        identity: {
          platform: 'bluesky',
          external_id: 'did:plc:abc123',
          handle: 'test.bsky.social',
          display_name: 'Test User',
          bio: null,
          avatar_url: null,
          profile_url: 'https://bsky.app/profile/test.bsky.social',
          links: [],
          verification_state: 'verified',
          ownership_proof: 'session',
          import_source: 'api',
          created_at: 1700000000,
          updated_at: 1700000000,
        },
      }),
    },
  }),
}))

describe('IdentifyBluesky', () => {
  beforeEach(() => {
    useImportStore.getState().reset()
  })

  it('renders handle input', () => {
    render(<IdentifyBluesky />)
    expect(screen.getByPlaceholderText('you.bsky.social')).toBeInTheDocument()
  })

  it('renders app password input', () => {
    render(<IdentifyBluesky />)
    expect(screen.getByPlaceholderText('xxxx-xxxx-xxxx-xxxx')).toBeInTheDocument()
  })

  it('renders login button', () => {
    render(<IdentifyBluesky />)
    expect(screen.getByText('🦋 Log In & Import')).toBeInTheDocument()
  })

  it('disables login button when fields are empty', () => {
    render(<IdentifyBluesky />)
    expect(screen.getByText('🦋 Log In & Import')).toBeDisabled()
  })

  it('enables login when both fields have values', async () => {
    const user = userEvent.setup()
    render(<IdentifyBluesky />)

    await user.type(screen.getByPlaceholderText('you.bsky.social'), 'test.bsky.social')
    await user.type(screen.getByPlaceholderText('xxxx-xxxx-xxxx-xxxx'), 'test-app-password')

    expect(screen.getByText('🦋 Log In & Import')).not.toBeDisabled()
  })

  it('shows app password generation link', () => {
    render(<IdentifyBluesky />)
    expect(screen.getByText('bsky.app/settings/app-passwords')).toBeInTheDocument()
  })

  it('shows security notice', () => {
    render(<IdentifyBluesky />)
    expect(screen.getByText(/never stored on any server/)).toBeInTheDocument()
  })
})
