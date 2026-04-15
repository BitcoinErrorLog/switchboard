import { useState } from 'react'
import { useImportStore } from '@/stores/import'
import { getPlatformConfig } from '@/platforms'
import type { BlueskyAdapter } from '@/adapters/bluesky'

export default function IdentifyBluesky() {
  const [handle, setHandle] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const store = useImportStore()

  const handleLogin = async () => {
    if (!handle.trim() || !appPassword.trim()) return
    setLoading(true)
    store.setStep('identifying')

    try {
      const config = getPlatformConfig('bluesky')
      if (!config) throw new Error('Bluesky platform not configured')

      const adapter = config.adapter as BlueskyAdapter
      adapter.setCredentials(handle.trim(), appPassword.trim())

      const result = await adapter.claimIdentity({
        raw_identifier: handle.trim(),
      })

      store.setIdentity(result.identity)
    } catch (err) {
      store.setError(
        err instanceof Error ? err.message : 'Failed to log in to Bluesky',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Bluesky Handle
          </label>
          <input
            type="text"
            placeholder="you.bsky.social"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-bluesky focus:outline-none focus:ring-1 focus:ring-bluesky disabled:opacity-50 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            App Password
          </label>
          <input
            type="password"
            placeholder="xxxx-xxxx-xxxx-xxxx"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-bluesky focus:outline-none focus:ring-1 focus:ring-bluesky disabled:opacity-50 text-sm"
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            Generate an app password at{' '}
            <a
              href="https://bsky.app/settings/app-passwords"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bluesky hover:underline"
            >
              bsky.app/settings/app-passwords
            </a>
          </p>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !handle.trim() || !appPassword.trim()}
          className="w-full rounded-lg bg-bluesky px-4 py-3 font-semibold text-white transition-colors hover:bg-bluesky/80 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : '🦋 Log In & Import'}
        </button>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-xs text-zinc-500">
          Logging in with your app password proves you own this account. Your
          credentials are only used in this browser session and are never stored
          on any server.
        </p>
      </div>
    </div>
  )
}
