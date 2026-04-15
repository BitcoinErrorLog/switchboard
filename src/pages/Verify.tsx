import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useVerificationStore } from '@/stores/verification'
import { useImportStore } from '@/stores/import'
import { useActivationStore } from '@/stores/activation'
import { checkSmsAvailability, checkLnAvailability } from '@/lib/homegate'
import SmsVerification from '@/components/SmsVerification'
import LnVerification from '@/components/LnVerification'

export default function Verify() {
  const { platform } = useParams<{ platform: string }>()
  const navigate = useNavigate()
  const verification = useVerificationStore()
  const { identity } = useImportStore()
  const activationMode = useActivationStore((s) => s.mode)
  const [smsAvailable, setSmsAvailable] = useState<boolean | null>(null)
  const [lnAvailable, setLnAvailable] = useState<boolean | null>(null)
  const [lnAmountSat, setLnAmountSat] = useState<number | null>(null)

  useEffect(() => {
    if (activationMode === 'existing') {
      navigate(`/${platform}/activate`)
      return
    }
  }, [activationMode, platform, navigate])

  useEffect(() => {
    Promise.all([
      checkSmsAvailability().then(setSmsAvailable),
      checkLnAvailability().then((info) => {
        setLnAvailable(!!info)
        if (info) setLnAmountSat(info.amountSat)
      }),
    ])
  }, [])

  useEffect(() => {
    if (verification.step === 'verified') {
      navigate(`/${platform}/activate`)
    }
  }, [verification.step, platform, navigate])

  if (!identity) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Import your data first.</p>
          <Link to={`/${platform}/import`} className="mt-4 inline-block text-pubky-light hover:underline">
            Go to import
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link
          to={`/${platform}/preview`}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back to preview
        </Link>

        <h2 className="mt-6 text-2xl font-bold text-zinc-100">Verify Your Identity</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Complete verification to create your Pubky account.
        </p>

        <div className="mt-8">
          {!verification.method && (
            <div className="space-y-3">
              {smsAvailable && (
                <button
                  onClick={() => verification.setMethod('sms')}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-left transition-all hover:border-pubky hover:bg-zinc-800/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-semibold text-zinc-100">SMS Verification</p>
                      <p className="text-sm text-zinc-400">Verify with your phone number</p>
                    </div>
                  </div>
                </button>
              )}
              {lnAvailable && (
                <button
                  onClick={() => verification.setMethod('lightning')}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-left transition-all hover:border-pubky hover:bg-zinc-800/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="font-semibold text-zinc-100">Lightning Payment</p>
                      <p className="text-sm text-zinc-400">
                        Pay {lnAmountSat ? `${lnAmountSat.toLocaleString()} sats` : ''} via Lightning Network
                      </p>
                    </div>
                  </div>
                </button>
              )}
              {smsAvailable === false && lnAvailable === false && (
                <div className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error">
                  No verification methods available. Please try again later.
                </div>
              )}
              {smsAvailable === null && lnAvailable === null && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-pubky border-t-transparent" />
                  <span className="ml-3 text-sm text-zinc-400">Checking availability...</span>
                </div>
              )}
            </div>
          )}

          {verification.method === 'sms' && (
            <div>
              <button
                onClick={() => {
                  verification.reset()
                }}
                className="mb-4 text-sm text-zinc-500 hover:text-zinc-300"
              >
                ← Choose different method
              </button>
              <SmsVerification />
            </div>
          )}

          {verification.method === 'lightning' && (
            <div>
              <button
                onClick={() => {
                  verification.reset()
                }}
                className="mb-4 text-sm text-zinc-500 hover:text-zinc-300"
              >
                ← Choose different method
              </button>
              <LnVerification />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
