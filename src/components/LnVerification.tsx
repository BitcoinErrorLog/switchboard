import { useState, useEffect, useRef } from 'react'
import { useVerificationStore } from '@/stores/verification'
import { createLnVerification, awaitLnVerification } from '@/lib/homegate'

export default function LnVerification() {
  const store = useVerificationStore()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const pollingRef = useRef(false)

  const handleCreateInvoice = async () => {
    setLoading(true)
    try {
      const result = await createLnVerification()
      store.setLnInvoice({
        bolt11Invoice: result.bolt11Invoice,
        lnVerificationId: result.id,
        amountSat: result.amountSat,
        expiresAt: result.expiresAt,
      })
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (store.step !== 'invoice_created' || !store.lnVerificationId || pollingRef.current) return

    pollingRef.current = true
    store.setStep('awaiting_payment')

    const poll = async () => {
      try {
        const result = await awaitLnVerification(store.lnVerificationId!)
        if (result.isPaid && result.signupCode) {
          store.setVerified(result.signupCode, result.homeserverPubky)
          pollingRef.current = false
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('timeout')) {
          // Retry on timeout
          if (pollingRef.current) {
            poll()
          }
        } else {
          store.setError(err instanceof Error ? err.message : 'Payment verification failed')
          pollingRef.current = false
        }
      }
    }

    poll()

    return () => {
      pollingRef.current = false
    }
  }, [store.step, store.lnVerificationId])

  const handleCopyInvoice = () => {
    if (store.bolt11Invoice) {
      navigator.clipboard.writeText(store.bolt11Invoice)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (store.step === 'idle' || store.step === 'error') {
    return (
      <div className="space-y-4">
        <button
          onClick={handleCreateInvoice}
          disabled={loading}
          className="w-full rounded-lg bg-pubky px-4 py-3 font-semibold text-white transition-colors hover:bg-pubky-dark disabled:opacity-50"
        >
          {loading ? 'Creating Invoice...' : 'Pay with Lightning'}
        </button>
        {store.amountSat && (
          <p className="text-center text-sm text-zinc-400">
            {store.amountSat.toLocaleString()} sats
          </p>
        )}
        {store.error && store.step === 'error' && (
          <div className="rounded-lg bg-error/10 border border-error/20 p-3 text-sm text-error">
            {store.error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {store.bolt11Invoice && (
        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
            <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider">Lightning Invoice</p>
            <p className="break-all text-xs text-zinc-300 font-mono leading-relaxed">
              {store.bolt11Invoice}
            </p>
          </div>
          <button
            onClick={handleCopyInvoice}
            className="w-full rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600"
          >
            {copied ? '✓ Copied!' : 'Copy Invoice'}
          </button>
        </div>
      )}

      {store.step === 'awaiting_payment' && (
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-pubky border-t-transparent" />
          <span className="text-sm text-zinc-400">Waiting for payment...</span>
        </div>
      )}

      {store.amountSat && (
        <p className="text-center text-sm text-zinc-500">
          Amount: {store.amountSat.toLocaleString()} sats
        </p>
      )}
    </div>
  )
}
