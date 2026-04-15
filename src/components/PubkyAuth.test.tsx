import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PubkyAuth from './PubkyAuth'

const mockAuthUrl = 'pubkyauth://relay/test-session-id'
let mockAwaitApproval: ReturnType<typeof vi.fn>

vi.mock('@/lib/pubky', () => ({
  signinWithAuthFlow: vi.fn().mockImplementation(async () => ({
    authorizationUrl: mockAuthUrl,
    awaitApproval: mockAwaitApproval,
  })),
}))

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => (
    <div data-testid="qr-code" data-value={value}>QR</div>
  ),
}))

describe('PubkyAuth', () => {
  const onAuthenticated = vi.fn()
  const onError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAwaitApproval = vi.fn().mockResolvedValue({
      session: { info: { publicKey: { z32: () => 'pk1abc' } } },
      pubkyId: 'pk1abc',
    })
  })

  it('renders connect button in idle state', () => {
    render(<PubkyAuth onAuthenticated={onAuthenticated} onError={onError} />)
    expect(screen.getByText('Connect with Pubky Ring')).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<PubkyAuth onAuthenticated={onAuthenticated} onError={onError} />)
    expect(screen.getByText('Sign in with Pubky Ring')).toBeInTheDocument()
  })

  it('shows QR code after clicking connect', async () => {
    const neverResolve = new Promise<never>(() => {})
    mockAwaitApproval = vi.fn().mockReturnValue(neverResolve)

    const user = userEvent.setup()
    render(<PubkyAuth onAuthenticated={onAuthenticated} onError={onError} />)

    await user.click(screen.getByText('Connect with Pubky Ring'))

    expect(await screen.findByTestId('qr-code')).toBeInTheDocument()
    expect(screen.getByTestId('qr-code')).toHaveAttribute('data-value', mockAuthUrl)
  })

  it('shows waiting message after QR appears', async () => {
    const neverResolve = new Promise<never>(() => {})
    mockAwaitApproval = vi.fn().mockReturnValue(neverResolve)

    const user = userEvent.setup()
    render(<PubkyAuth onAuthenticated={onAuthenticated} onError={onError} />)

    await user.click(screen.getByText('Connect with Pubky Ring'))

    expect(await screen.findByText('Waiting for approval...')).toBeInTheDocument()
  })

  it('calls onAuthenticated on successful approval', async () => {
    const user = userEvent.setup()
    render(<PubkyAuth onAuthenticated={onAuthenticated} onError={onError} />)

    await user.click(screen.getByText('Connect with Pubky Ring'))

    await vi.waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith(
        expect.objectContaining({ info: expect.any(Object) }),
        'pk1abc',
      )
    })
  })

  it('shows error state on failure', async () => {
    mockAwaitApproval = vi.fn().mockRejectedValue(new Error('Connection refused'))

    const user = userEvent.setup()
    render(<PubkyAuth onAuthenticated={onAuthenticated} onError={onError} />)

    await user.click(screen.getByText('Connect with Pubky Ring'))

    expect(await screen.findByText('Connection refused')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledWith('Connection refused')
  })

  it('shows try again button on error and resets state', async () => {
    mockAwaitApproval = vi.fn().mockRejectedValue(new Error('Network error'))

    const user = userEvent.setup()
    render(<PubkyAuth onAuthenticated={onAuthenticated} onError={onError} />)

    await user.click(screen.getByText('Connect with Pubky Ring'))
    await screen.findByText('Try Again')

    await user.click(screen.getByText('Try Again'))

    expect(screen.getByText('Connect with Pubky Ring')).toBeInTheDocument()
  })
})
