const HOMEGATE_URL = import.meta.env.VITE_HOMEGATE_URL || 'https://homegate.pubky.app'

export interface SmsVerificationResult {
  valid: boolean
  signupCode?: string
  homeserverPubky?: string
}

export interface LnVerificationCreate {
  id: string
  bolt11Invoice: string
  amountSat: number
  expiresAt: number
}

export interface LnVerificationStatus {
  id: string
  amountSat: number
  expiresAt: number
  isPaid: boolean
  signupCode: string | null
  homeserverPubky: string
  createdAt: number
}

export interface LnVerificationInfo {
  amountSat: number
}

export async function checkSmsAvailability(): Promise<boolean> {
  try {
    const res = await fetch(`${HOMEGATE_URL}/sms_verification/info`)
    return res.ok
  } catch {
    return false
  }
}

export async function checkLnAvailability(): Promise<LnVerificationInfo | null> {
  try {
    const res = await fetch(`${HOMEGATE_URL}/ln_verification/info`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function sendSmsCode(phoneNumber: string): Promise<void> {
  const res = await fetch(`${HOMEGATE_URL}/sms_verification/send_code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `SMS send failed: ${res.status}`)
  }
}

export async function validateSmsCode(
  phoneNumber: string,
  code: string,
): Promise<SmsVerificationResult> {
  const res = await fetch(`${HOMEGATE_URL}/sms_verification/validate_code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `SMS validation failed: ${res.status}`)
  }
  const data = await res.json()
  return {
    valid: data.valid === 'true',
    signupCode: data.signupCode,
    homeserverPubky: data.homeserverPubky,
  }
}

export async function createLnVerification(): Promise<LnVerificationCreate> {
  const res = await fetch(`${HOMEGATE_URL}/ln_verification`, {
    method: 'POST',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `LN verification creation failed: ${res.status}`)
  }
  return res.json()
}

export async function getLnVerificationStatus(
  id: string,
): Promise<LnVerificationStatus> {
  const res = await fetch(`${HOMEGATE_URL}/ln_verification/${id}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `LN status check failed: ${res.status}`)
  }
  return res.json()
}

export async function awaitLnVerification(
  id: string,
): Promise<LnVerificationStatus> {
  const res = await fetch(`${HOMEGATE_URL}/ln_verification/${id}/await`)
  if (!res.ok) {
    if (res.status === 408) {
      throw new Error('Payment timeout — please retry')
    }
    const text = await res.text()
    throw new Error(text || `LN await failed: ${res.status}`)
  }
  return res.json()
}
