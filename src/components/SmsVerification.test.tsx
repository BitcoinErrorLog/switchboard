import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SmsVerification from './SmsVerification'
import { useVerificationStore } from '@/stores/verification'

vi.mock('@/lib/homegate', () => ({
  sendSmsCode: vi.fn().mockResolvedValue(undefined),
  validateSmsCode: vi.fn().mockResolvedValue({
    valid: true,
    signupCode: 'code123',
    homeserverPubky: 'hs_pubky',
  }),
}))

describe('SmsVerification', () => {
  beforeEach(() => {
    useVerificationStore.getState().reset()
  })

  it('renders phone number input', () => {
    render(<SmsVerification />)
    expect(screen.getByPlaceholderText('+1234567890')).toBeInTheDocument()
  })

  it('renders send code button', () => {
    render(<SmsVerification />)
    expect(screen.getByText('Send Verification Code')).toBeInTheDocument()
  })

  it('validates phone number format', async () => {
    const user = userEvent.setup()
    render(<SmsVerification />)

    const input = screen.getByPlaceholderText('+1234567890')
    await user.type(input, 'invalid')
    await user.click(screen.getByText('Send Verification Code'))

    expect(useVerificationStore.getState().error).toContain('E.164')
  })

  it('shows code input after sending', async () => {
    useVerificationStore.getState().setPhoneNumber('+1234567890')
    useVerificationStore.getState().setStep('code_sent')

    render(<SmsVerification />)
    expect(screen.getByPlaceholderText('123456')).toBeInTheDocument()
    expect(screen.getByText('Verify Code')).toBeInTheDocument()
  })

  it('validates code format', async () => {
    useVerificationStore.getState().setPhoneNumber('+1234567890')
    useVerificationStore.getState().setStep('code_sent')
    useVerificationStore.getState().setSmsCode('12345')

    const user = userEvent.setup()
    render(<SmsVerification />)

    const verifyBtn = screen.getByText('Verify Code')
    expect(verifyBtn).toBeDisabled()
  })

  it('shows resend code button', () => {
    useVerificationStore.getState().setStep('code_sent')
    render(<SmsVerification />)
    expect(screen.getByText('Resend Code')).toBeInTheDocument()
  })
})
