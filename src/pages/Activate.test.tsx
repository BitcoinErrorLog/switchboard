import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Activate from './Activate'
import { useActivationStore } from '@/stores/activation'
import { useImportStore } from '@/stores/import'
import { useVerificationStore } from '@/stores/verification'

vi.mock('@/lib/pubky', () => ({
  generateKeypair: vi.fn().mockReturnValue({
    keypair: {},
    mnemonic: 'test '.repeat(23) + 'test',
    pubkyId: 'pk1test',
  }),
  keypairFromMnemonic: vi.fn().mockReturnValue({
    keypair: {},
    pubkyId: 'pk1test',
  }),
  signup: vi.fn().mockResolvedValue({
    info: { publicKey: { z32: () => 'pk1test' } },
    storage: { putJson: vi.fn() },
  }),
  writeJson: vi.fn().mockResolvedValue(undefined),
  signinWithAuthFlow: vi.fn(),
  AuthFlowKind: { signin: vi.fn() },
}))

vi.mock('@/core/mapper', () => ({
  mapIdentityToUser: vi.fn().mockReturnValue({ path: '/pub/pubky.app/profile.json', json: {}, url: '' }),
  mapObjectToPost: vi.fn().mockReturnValue({ path: '/pub/pubky.app/posts/1', json: {}, url: 'pubky://pk1test/pub/pubky.app/posts/1' }),
  mapEdgeToFollow: vi.fn().mockReturnValue({ path: '/pub/pubky.app/follows/x', json: {} }),
  mapTagToTag: vi.fn().mockReturnValue({ path: '/pub/pubky.app/tags/x', json: {} }),
}))

vi.mock('@/lib/identity-links', () => ({
  registerLink: vi.fn(),
  lookupPubkyId: vi.fn().mockReturnValue(null),
}))

vi.mock('@/components/PubkyAuth', () => ({
  default: ({ onAuthenticated }: { onAuthenticated: (s: any, id: string) => void; onError: (e: string) => void }) => (
    <button
      data-testid="mock-pubky-auth"
      onClick={() => onAuthenticated(
        { info: { publicKey: { z32: () => 'pk1existing' } }, storage: { putJson: vi.fn() } },
        'pk1existing',
      )}
    >
      Mock PubkyAuth
    </button>
  ),
}))

vi.mock('@/components/ActivationProgress', () => ({
  default: () => <div data-testid="activation-progress">Progress</div>,
}))

function renderActivate(platform = 'nostr') {
  return render(
    <MemoryRouter initialEntries={[`/${platform}/activate`]}>
      <Routes>
        <Route path="/:platform/activate" element={<Activate />} />
        <Route path="/:platform/done" element={<div>Done Page</div>} />
        <Route path="/:platform/verify" element={<div>Verify Page</div>} />
        <Route path="/:platform/import" element={<div>Import Page</div>} />
        <Route path="/:platform/preview" element={<div>Preview Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const verifiedIdentity = {
  platform: 'nostr' as const,
  external_id: 'hex123',
  handle: 'alice',
  display_name: 'Alice',
  bio: 'Hello',
  avatar_url: null,
  profile_url: null,
  links: [],
  verification_state: 'verified' as const,
  ownership_proof: 'sig',
  import_source: 'relay',
  created_at: 1700000000,
  updated_at: 1700000000,
}

describe('Activate', () => {
  beforeEach(() => {
    useActivationStore.getState().reset()
    useImportStore.getState().reset()
    useVerificationStore.getState().reset()
  })

  describe('mode chooser', () => {
    beforeEach(() => {
      useImportStore.setState({ identity: verifiedIdentity })
    })

    it('shows mode selection when no mode is chosen', () => {
      renderActivate()
      expect(screen.getByText('Create a New Pubky')).toBeInTheDocument()
      expect(screen.getByText('Link to Existing Pubky')).toBeInTheDocument()
    })

    it('shows new pubky description', () => {
      renderActivate()
      expect(
        screen.getByText(/Generate a new keypair, verify via Homegate/),
      ).toBeInTheDocument()
    })

    it('shows existing pubky description', () => {
      renderActivate()
      expect(
        screen.getByText(/Sign in with Pubky Ring and merge/),
      ).toBeInTheDocument()
    })

    it('selecting new account sets mode to new', async () => {
      const user = userEvent.setup()
      renderActivate()

      await user.click(screen.getByText('Create a New Pubky'))

      expect(useActivationStore.getState().mode).toBe('new')
    })

    it('selecting existing account sets mode to existing', async () => {
      const user = userEvent.setup()
      renderActivate()

      await user.click(screen.getByText('Link to Existing Pubky'))

      expect(useActivationStore.getState().mode).toBe('existing')
    })
  })

  describe('new account flow', () => {
    beforeEach(() => {
      useImportStore.setState({ identity: verifiedIdentity })
      useVerificationStore.setState({
        signupCode: 'code123',
        homeserverPubky: 'pk1homeserver',
      })
      useActivationStore.setState({ mode: 'new' })
    })

    it('shows create button for new account', () => {
      renderActivate()
      expect(screen.getByText('Create My Pubky Account')).toBeInTheDocument()
    })

    it('shows link to go back to mode selection', () => {
      renderActivate()
      expect(screen.getByText('← Choose a different option')).toBeInTheDocument()
    })

    it('prompts for verification if signup code missing', () => {
      useVerificationStore.setState({ signupCode: null, homeserverPubky: null })
      renderActivate()
      expect(screen.getByText('Complete verification first.')).toBeInTheDocument()
      expect(screen.getByText('Go to verification')).toBeInTheDocument()
    })
  })

  describe('existing account flow', () => {
    beforeEach(() => {
      useImportStore.setState({ identity: verifiedIdentity })
      useActivationStore.setState({ mode: 'existing' })
    })

    it('shows PubkyAuth component', () => {
      renderActivate()
      expect(screen.getByTestId('mock-pubky-auth')).toBeInTheDocument()
    })

    it('shows merge strategy picker after authentication', async () => {
      const user = userEvent.setup()
      renderActivate()

      await user.click(screen.getByTestId('mock-pubky-auth'))

      expect(await screen.findByText('Full Merge')).toBeInTheDocument()
      expect(screen.getByText('Additive Only')).toBeInTheDocument()
      expect(screen.getByText('Link Only')).toBeInTheDocument()
    })

    it('shows authenticated confirmation in merge picker', async () => {
      const user = userEvent.setup()
      renderActivate()

      await user.click(screen.getByTestId('mock-pubky-auth'))

      expect(
        await screen.findByText('✓ Authenticated — choose what to import'),
      ).toBeInTheDocument()
    })

    it('sets pubkyId on existing session', async () => {
      const user = userEvent.setup()
      renderActivate()

      await user.click(screen.getByTestId('mock-pubky-auth'))

      await vi.waitFor(() => {
        expect(useActivationStore.getState().pubkyId).toBe('pk1existing')
      })
    })

    it('shows back button to mode selection', () => {
      renderActivate()
      expect(screen.getByText('← Choose a different option')).toBeInTheDocument()
    })
  })

  describe('ownership verification required', () => {
    it('shows ownership verification message when identity not verified', () => {
      useImportStore.setState({
        identity: { ...verifiedIdentity, verification_state: 'claimed' },
      })
      renderActivate()
      expect(
        screen.getByText('You must verify ownership of this account before activating.'),
      ).toBeInTheDocument()
    })

    it('shows link to import page for verification', () => {
      useImportStore.setState({
        identity: { ...verifiedIdentity, verification_state: 'claimed' },
      })
      renderActivate()
      expect(screen.getByText('Verify ownership')).toBeInTheDocument()
    })
  })
})
