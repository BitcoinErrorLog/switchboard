import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LnVerification from './LnVerification'
import { useVerificationStore } from '@/stores/verification'

vi.mock('@/lib/homegate', () => ({
  createLnVerification: vi.fn().mockResolvedValue({
    id: 'ln_001',
    bolt11Invoice: 'lnbc1000n1...',
    amountSat: 1000,
    expiresAt: 9999999999,
  }),
  awaitLnVerification: vi.fn().mockResolvedValue({
    isPaid: true,
    signupCode: 'ln_code_123',
    homeserverPubky: 'hs_pubky',
  }),
}))

describe('LnVerification', () => {
  beforeEach(() => {
    useVerificationStore.getState().reset()
  })

  it('renders create invoice button', () => {
    render(<LnVerification />)
    expect(screen.getByText('Pay with Lightning')).toBeInTheDocument()
  })

  it('shows invoice after creation', async () => {
    useVerificationStore.getState().setLnInvoice({
      bolt11Invoice: 'lnbc1000n1...',
      lnVerificationId: 'ln_001',
      amountSat: 1000,
      expiresAt: 9999999999,
    })

    render(<LnVerification />)
    expect(screen.getByText('lnbc1000n1...')).toBeInTheDocument()
    expect(screen.getByText('Copy Invoice')).toBeInTheDocument()
  })

  it('shows amount in sats', () => {
    useVerificationStore.getState().setLnInvoice({
      bolt11Invoice: 'lnbc...',
      lnVerificationId: 'ln_001',
      amountSat: 1000,
      expiresAt: 9999999999,
    })

    render(<LnVerification />)
    expect(screen.getByText(/1,000 sats/)).toBeInTheDocument()
  })

  it('creates invoice on button click', async () => {
    const user = userEvent.setup()
    render(<LnVerification />)
    await user.click(screen.getByText('Pay with Lightning'))
    const { createLnVerification } = await import('@/lib/homegate')
    expect(createLnVerification).toHaveBeenCalled()
  })
})
