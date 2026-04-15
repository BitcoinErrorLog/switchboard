import { useState } from 'react'
import { useImportStore } from '@/stores/import'
import { getPlatformConfig } from '@/platforms'
import {
  hasNip07Extension,
  generateVerificationCode,
  checkVerificationPost,
} from '@/adapters/nostr/identity'

export default function IdentifyNostr() {
  const [npubInput, setNpubInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const store = useImportStore()

  const pendingIdentity = store.identity
  const isVerified = pendingIdentity?.verification_state === 'verified'

  const handleNpubSubmit = async () => {
    if (!npubInput.trim()) return
    setLoading(true)
    store.setStep('identifying')

    try {
      const config = getPlatformConfig('nostr')
      if (!config) throw new Error('Nostr platform not configured')

      const result = await config.adapter.claimIdentity({
        raw_identifier: npubInput.trim(),
      })
      store.setIdentity(result.identity)
      setVerificationCode(generateVerificationCode())
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to identify Nostr account')
    } finally {
      setLoading(false)
    }
  }

  const handleNip07Connect = async () => {
    if (!hasNip07Extension()) {
      store.setError('No Nostr browser extension found (NIP-07)')
      return
    }

    setLoading(true)
    store.setStep('identifying')

    try {
      const hexPubkey = await window.nostr!.getPublicKey()
      const config = getPlatformConfig('nostr')
      if (!config) throw new Error('Nostr platform not configured')

      const claimResult = await config.adapter.claimIdentity({
        raw_identifier: hexPubkey,
      })

      const verifyResult = await config.adapter.verifyOwnership({
        identity: claimResult.identity,
      })

      store.setIdentity(verifyResult.identity)
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to connect Nostr extension')
    } finally {
      setLoading(false)
    }
  }

  const handleNip07VerifyPending = async () => {
    if (!pendingIdentity || !hasNip07Extension()) return
    setLoading(true)

    try {
      const config = getPlatformConfig('nostr')
      if (!config) throw new Error('Nostr platform not configured')

      const verifyResult = await config.adapter.verifyOwnership({
        identity: pendingIdentity,
      })

      if (verifyResult.verified) {
        store.setIdentity(verifyResult.identity)
      } else {
        store.setError('Extension public key does not match this account')
      }
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckPost = async () => {
    if (!pendingIdentity || !verificationCode) return
    setChecking(true)

    try {
      const found = await checkVerificationPost(
        pendingIdentity.external_id,
        verificationCode,
      )

      if (found) {
        store.setIdentity({
          ...pendingIdentity,
          verification_state: 'verified',
          ownership_proof: verificationCode,
        })
      } else {
        store.setError('Verification note not found yet. Post it and try again.')
      }
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to check for verification post')
    } finally {
      setChecking(false)
    }
  }

  if (pendingIdentity && !isVerified) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <h3 className="text-base font-semibold text-warning">Verify Ownership</h3>
          <p className="mt-2 text-sm text-zinc-400">
            You identified <span className="text-zinc-200 font-medium">{pendingIdentity.display_name || pendingIdentity.external_id.slice(0, 16) + '…'}</span>.
            To prevent impersonation, prove you own this account.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-zinc-300">Option 1: Sign with Extension</h4>
          <button
            onClick={handleNip07VerifyPending}
            disabled={loading || !hasNip07Extension()}
            className="w-full rounded-lg border border-nostr/50 bg-nostr/10 px-4 py-3 font-semibold text-nostr transition-colors hover:bg-nostr/20 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : '⚡ Verify with Nostr Extension'}
          </button>
          {!hasNip07Extension() && (
            <p className="text-xs text-zinc-500">No NIP-07 extension detected</p>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-zinc-950 px-3 text-zinc-500 uppercase tracking-wider">or</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-zinc-300">Option 2: Post a Verification Note</h4>
          <p className="text-xs text-zinc-500">
            Post a note containing this code from your Nostr account using any client, then click Check.
          </p>
          {verificationCode && (
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-mono text-pubky-light select-all break-all">
                {verificationCode}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(verificationCode)}
                className="shrink-0 rounded-lg border border-zinc-700 px-3 py-3 text-sm text-zinc-300 hover:border-zinc-600"
                title="Copy code"
              >
                📋
              </button>
            </div>
          )}
          <button
            onClick={handleCheckPost}
            disabled={checking}
            className="w-full rounded-lg bg-pubky px-4 py-3 font-semibold text-white transition-colors hover:bg-pubky-dark disabled:opacity-50"
          >
            {checking ? 'Checking relays...' : 'Check for Verification Note'}
          </button>
        </div>

        <button
          onClick={() => {
            store.reset()
            setVerificationCode(null)
          }}
          className="w-full rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-600"
        >
          Start Over
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Your npub or hex public key
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="npub1... or hex pubkey"
            value={npubInput}
            onChange={(e) => setNpubInput(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-pubky focus:outline-none focus:ring-1 focus:ring-pubky disabled:opacity-50 text-sm"
          />
          <button
            onClick={handleNpubSubmit}
            disabled={loading || !npubInput.trim()}
            className="rounded-lg bg-pubky px-6 py-3 font-semibold text-white transition-colors hover:bg-pubky-dark disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Loading...' : 'Look Up'}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-zinc-950 px-3 text-zinc-500 uppercase tracking-wider">or</span>
        </div>
      </div>

      <button
        onClick={handleNip07Connect}
        disabled={loading}
        className="w-full rounded-lg border border-nostr/50 bg-nostr/10 px-4 py-3 font-semibold text-nostr transition-colors hover:bg-nostr/20 disabled:opacity-50"
      >
        {loading ? 'Connecting...' : '⚡ Connect with Nostr Extension'}
      </button>
      <p className="text-center text-xs text-zinc-500">
        Requires a NIP-07 browser extension like Alby or nos2x. Instantly verifies ownership.
      </p>
    </div>
  )
}
