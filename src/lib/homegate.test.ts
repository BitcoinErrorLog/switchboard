import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('homegate client request shaping', () => {
  const HOMEGATE_URL = 'https://homegate.pubky.app'

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('sendSmsCode sends POST with correct body', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    const { sendSmsCode } = await import('./homegate')
    await sendSmsCode('+1234567890')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/sms_verification/send_code'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('+1234567890'),
      }),
    )
  })

  it('validateSmsCode sends POST with phone and code', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          valid: 'true',
          signupCode: 'code123',
          homeserverPubky: 'pubky_hs',
        }),
    })

    const { validateSmsCode } = await import('./homegate')
    const result = await validateSmsCode('+1234567890', '123456')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/sms_verification/validate_code'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('123456'),
      }),
    )
    expect(result.valid).toBe(true)
    expect(result.signupCode).toBe('code123')
    expect(result.homeserverPubky).toBe('pubky_hs')
  })

  it('createLnVerification sends POST', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'ln_001',
          bolt11: 'lnbc...',
          amount_sat: 1000,
          expires_at: 9999999999,
        }),
    })

    const { createLnVerification } = await import('./homegate')
    const result = await createLnVerification()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ln_verification'),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.id).toBe('ln_001')
  })
})
