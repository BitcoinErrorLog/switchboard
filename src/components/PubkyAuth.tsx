import { useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { signinWithAuthFlow } from '@/lib/pubky'
import type { Session } from '@synonymdev/pubky'

interface PubkyAuthProps {
  onAuthenticated: (session: Session, pubkyId: string) => void
  onError: (error: string) => void
}

type AuthState = 'idle' | 'connecting' | 'waiting' | 'complete' | 'error'

export default function PubkyAuth({ onAuthenticated, onError }: PubkyAuthProps) {
  const [state, setState] = useState<AuthState>('idle')
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleStart = useCallback(async () => {
    setState('connecting')
    setErrorMsg(null)

    try {
      const { authorizationUrl, awaitApproval } = await signinWithAuthFlow()
      setAuthUrl(authorizationUrl)
      setState('waiting')

      const { session, pubkyId } = await awaitApproval()
      setState('complete')
      onAuthenticated(session, pubkyId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      setErrorMsg(msg)
      setState('error')
      onError(msg)
    }
  }, [onAuthenticated, onError])

  const handleRetry = useCallback(() => {
    setState('idle')
    setAuthUrl(null)
    setErrorMsg(null)
  }, [])

  return (
    <div className="space-y-6">
      {state === 'idle' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6">
            <h3 className="text-base font-semibold text-zinc-100">
              Sign in with Pubky Ring
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Scan a QR code with your Pubky Ring app to authenticate
              and link your existing account.
            </p>
          </div>
          <button
            onClick={handleStart}
            className="w-full rounded-xl bg-pubky px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-pubky-dark"
          >
            Connect with Pubky Ring
          </button>
        </div>
      )}

      {state === 'connecting' && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-pubky border-t-transparent" />
          <span className="ml-3 text-sm text-zinc-400">
            Starting authentication flow...
          </span>
        </div>
      )}

      {state === 'waiting' && authUrl && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-center">
            <p className="text-sm text-zinc-400 mb-4">
              Scan this QR code with Pubky Ring to sign in
            </p>
            <div className="inline-block rounded-xl bg-white p-4">
              <QRCodeSVG
                value={authUrl}
                size={240}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="mt-4 text-xs text-zinc-500 break-all">
              Or open this link in Pubky Ring:
            </p>
            <a
              href={authUrl}
              className="mt-1 block text-xs text-pubky-light hover:underline break-all"
            >
              {authUrl}
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-pubky border-t-transparent" />
            Waiting for approval...
          </div>
        </div>
      )}

      {state === 'complete' && (
        <div className="flex items-center justify-center gap-2 py-8 text-success">
          <span className="text-lg">✓</span>
          <span className="text-sm font-medium">Authenticated successfully</span>
        </div>
      )}

      {state === 'error' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error">
            {errorMsg}
          </div>
          <button
            onClick={handleRetry}
            className="w-full rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:border-zinc-600"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
