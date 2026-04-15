import { create } from 'zustand'

export type VerifyMethod = 'sms' | 'lightning' | null
export type VerifyStep = 'idle' | 'sending' | 'code_sent' | 'validating' | 'invoice_created' | 'awaiting_payment' | 'verified' | 'error'

interface VerificationState {
  method: VerifyMethod
  step: VerifyStep
  phoneNumber: string
  smsCode: string
  signupCode: string | null
  homeserverPubky: string | null
  bolt11Invoice: string | null
  lnVerificationId: string | null
  amountSat: number | null
  expiresAt: number | null
  error: string | null

  setMethod: (method: VerifyMethod) => void
  setStep: (step: VerifyStep) => void
  setPhoneNumber: (phoneNumber: string) => void
  setSmsCode: (code: string) => void
  setVerified: (signupCode: string, homeserverPubky: string) => void
  setLnInvoice: (data: {
    bolt11Invoice: string
    lnVerificationId: string
    amountSat: number
    expiresAt: number
  }) => void
  setError: (error: string) => void
  reset: () => void
}

const initialState = {
  method: null as VerifyMethod,
  step: 'idle' as VerifyStep,
  phoneNumber: '',
  smsCode: '',
  signupCode: null,
  homeserverPubky: null,
  bolt11Invoice: null,
  lnVerificationId: null,
  amountSat: null,
  expiresAt: null,
  error: null,
}

export const useVerificationStore = create<VerificationState>((set) => ({
  ...initialState,

  setMethod: (method) => set({ method }),
  setStep: (step) => set({ step }),
  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
  setSmsCode: (code) => set({ smsCode: code }),
  setVerified: (signupCode, homeserverPubky) =>
    set({ signupCode, homeserverPubky, step: 'verified' }),
  setLnInvoice: (data) =>
    set({
      bolt11Invoice: data.bolt11Invoice,
      lnVerificationId: data.lnVerificationId,
      amountSat: data.amountSat,
      expiresAt: data.expiresAt,
      step: 'invoice_created',
    }),
  setError: (error) => set({ error, step: 'error' }),
  reset: () => set(initialState),
}))
