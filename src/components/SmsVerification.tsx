import { useState } from 'react'
import { useVerificationStore } from '@/stores/verification'
import { sendSmsCode, validateSmsCode } from '@/lib/homegate'

export default function SmsVerification() {
  const store = useVerificationStore()
  const [loading, setLoading] = useState(false)

  const handleSendCode = async () => {
    if (!store.phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      store.setError('Phone number must be in E.164 format (e.g., +1234567890)')
      return
    }

    setLoading(true)
    store.setStep('sending')
    try {
      await sendSmsCode(store.phoneNumber)
      store.setStep('code_sent')
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to send SMS code')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateCode = async () => {
    if (!store.smsCode.match(/^\d{6}$/)) {
      store.setError('Code must be exactly 6 digits')
      return
    }

    setLoading(true)
    store.setStep('validating')
    try {
      const result = await validateSmsCode(store.phoneNumber, store.smsCode)
      if (result.valid && result.signupCode && result.homeserverPubky) {
        store.setVerified(result.signupCode, result.homeserverPubky)
      } else {
        store.setError('Invalid verification code')
      }
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to validate code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Phone Number
        </label>
        <input
          type="tel"
          placeholder="+1234567890"
          value={store.phoneNumber}
          onChange={(e) => store.setPhoneNumber(e.target.value)}
          disabled={store.step === 'code_sent' || store.step === 'validating' || loading}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-pubky focus:outline-none focus:ring-1 focus:ring-pubky disabled:opacity-50"
        />
      </div>

      {(store.step === 'idle' || store.step === 'sending' || store.step === 'error') && (
        <button
          onClick={handleSendCode}
          disabled={loading || !store.phoneNumber}
          className="w-full rounded-lg bg-pubky px-4 py-3 font-semibold text-white transition-colors hover:bg-pubky-dark disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      )}

      {(store.step === 'code_sent' || store.step === 'validating') && (
        <>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Verification Code
            </label>
            <input
              type="text"
              placeholder="123456"
              maxLength={6}
              value={store.smsCode}
              onChange={(e) => store.setSmsCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 text-center text-2xl tracking-[0.5em] placeholder-zinc-500 focus:border-pubky focus:outline-none focus:ring-1 focus:ring-pubky disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleValidateCode}
            disabled={loading || store.smsCode.length !== 6}
            className="w-full rounded-lg bg-pubky px-4 py-3 font-semibold text-white transition-colors hover:bg-pubky-dark disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          <button
            onClick={handleSendCode}
            disabled={loading}
            className="w-full rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
          >
            Resend Code
          </button>
        </>
      )}

      {store.error && store.step === 'error' && (
        <div className="rounded-lg bg-error/10 border border-error/20 p-3 text-sm text-error">
          {store.error}
        </div>
      )}
    </div>
  )
}
