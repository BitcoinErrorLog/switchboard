import { useState } from 'react'
import { useImportStore } from '@/stores/import'
import { getPlatformConfig } from '@/platforms'
import { hasNip07Extension } from '@/adapters/nostr/identity'

export default function IdentifyNostr() {
  const [npubInput, setNpubInput] = useState('')
  const [loading, setLoading] = useState(false)
  const store = useImportStore()

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
            {loading ? 'Loading...' : 'Import'}
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
        Requires a NIP-07 browser extension like Alby or nos2x
      </p>
    </div>
  )
}
