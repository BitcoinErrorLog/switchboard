import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccountsStore, type LinkedAccount } from '@/stores/accounts'
import { getPlatformConfig } from '@/platforms'
import { hasNip07Extension, getNip07PublicKey, verifyOwnershipWithSecretKey } from '@/adapters/nostr/identity'
import { decodeNsec, setSecretKey, secretKeyToHex, clearSecretKey } from '@/adapters/nostr/signer'
import { login as blueskyLogin, getSessionData as getBlueskySession } from '@/adapters/bluesky/client'
import { parseProfile as parseBlueskyProfile } from '@/adapters/bluesky/parser'
import { Agent } from '@atproto/api'

export default function Accounts() {
  const { accounts, linkAccount, unlinkAccount } = useAccountsStore()

  const nostrAccount = accounts.get('nostr')
  const blueskyAccount = accounts.get('bluesky')

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-300">← Home</Link>

        <h2 className="mt-6 text-2xl font-bold text-zinc-100">Linked Accounts</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Connect your accounts for cross-platform reading, writing, and sync.
        </p>

        <div className="mt-8 space-y-6">
          <NostrAccountCard
            account={nostrAccount}
            onLink={linkAccount}
            onUnlink={() => unlinkAccount('nostr')}
          />
          <BlueskyAccountCard
            account={blueskyAccount}
            onLink={linkAccount}
            onUnlink={() => unlinkAccount('bluesky')}
          />
        </div>
      </div>
    </div>
  )
}

function NostrAccountCard({
  account,
  onLink,
  onUnlink,
}: {
  account: LinkedAccount | undefined
  onLink: (a: LinkedAccount) => void
  onUnlink: () => void
}) {
  const [nsecInput, setNsecInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setSessionData } = useAccountsStore()

  const handleNsecConnect = async () => {
    if (!nsecInput.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { secretKey, hexPubkey } = decodeNsec(nsecInput)
      const verify = verifyOwnershipWithSecretKey(hexPubkey, secretKey)
      if (!verify.verified) throw new Error('Key verification failed')

      setSecretKey(secretKey)

      const config = getPlatformConfig('nostr')
      if (!config) throw new Error('Nostr platform not available')

      const result = await config.adapter.claimIdentity({ raw_identifier: hexPubkey })

      const linkedAccount: LinkedAccount = {
        platform: 'nostr',
        identity: {
          ...result.identity,
          verification_state: 'verified',
          ownership_proof: verify.proof,
        },
        connected: true,
        lastSynced: null,
        sessionData: { secretKeyHex: secretKeyToHex(secretKey) },
      }

      onLink(linkedAccount)
      setNsecInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid key')
    } finally {
      setLoading(false)
    }
  }

  const handleNip07Connect = async () => {
    if (!hasNip07Extension()) {
      setError('No NIP-07 extension found.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const hexPubkey = await getNip07PublicKey()
      const config = getPlatformConfig('nostr')
      if (!config) throw new Error('Nostr platform not available')

      const result = await config.adapter.claimIdentity({ raw_identifier: hexPubkey })
      const verifyResult = await config.adapter.verifyOwnership({ identity: result.identity })
      if (!verifyResult.verified) throw new Error('Verification failed')

      onLink({
        platform: 'nostr',
        identity: verifyResult.identity,
        connected: true,
        lastSynced: null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    clearSecretKey()
    onUnlink()
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">⚡</span>
        <h3 className="text-lg font-semibold text-zinc-100">Nostr</h3>
      </div>

      {account?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-sm text-zinc-300">
              {account.identity.display_name || account.identity.external_id.slice(0, 16) + '...'}
            </span>
          </div>
          {account.sessionData?.secretKeyHex && (
            <span className="inline-block rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              Local key
            </span>
          )}
          {account.lastSynced && (
            <p className="text-xs text-zinc-500">
              Last synced: {new Date(account.lastSynced).toLocaleString()}
            </p>
          )}
          <button
            onClick={handleDisconnect}
            className="text-sm text-zinc-500 hover:text-error transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Private key</label>
            <input
              type="password"
              placeholder="nsec1... or hex private key"
              value={nsecInput}
              onChange={(e) => setNsecInput(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-nostr focus:outline-none disabled:opacity-50 font-mono"
            />
            <p className="text-xs text-zinc-600">
              Your key stays in this browser. Never shared with any server.
            </p>
            <button
              onClick={handleNsecConnect}
              disabled={loading || !nsecInput.trim()}
              className="w-full rounded-lg border border-nostr/50 bg-nostr/10 px-4 py-2.5 text-sm font-semibold text-nostr hover:bg-nostr/20 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect with Key'}
            </button>
          </div>

          {hasNip07Extension() && (
            <div className="border-t border-zinc-800 pt-3">
              <button
                onClick={handleNip07Connect}
                disabled={loading}
                className="w-full rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-50"
              >
                Use browser extension instead
              </button>
            </div>
          )}

          {error && <p className="text-xs text-error">{error}</p>}
        </div>
      )}
    </div>
  )
}

function BlueskyAccountCard({
  account,
  onLink,
  onUnlink,
}: {
  account: LinkedAccount | undefined
  onLink: (a: LinkedAccount) => void
  onUnlink: () => void
}) {
  const [handle, setHandle] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!handle.trim() || !appPassword.trim()) return
    setLoading(true)
    setError(null)
    try {
      await blueskyLogin({ identifier: handle.trim(), password: appPassword.trim() })
      const sessionData = getBlueskySession()
      if (!sessionData) throw new Error('No session')

      const agent = new Agent('https://bsky.social')
      const profileRes = await agent.getProfile({ actor: sessionData.did })
      const identity = parseBlueskyProfile(profileRes.data, true)

      onLink({
        platform: 'bluesky',
        identity,
        connected: true,
        lastSynced: null,
        sessionData: sessionData as unknown as Record<string, unknown>,
      })

      setHandle('')
      setAppPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🦋</span>
        <h3 className="text-lg font-semibold text-zinc-100">Bluesky</h3>
      </div>

      {account?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-sm text-zinc-300">
              @{account.identity.handle || account.identity.external_id.slice(0, 16) + '…'}
            </span>
          </div>
          {account.lastSynced && (
            <p className="text-xs text-zinc-500">
              Last synced: {new Date(account.lastSynced).toLocaleString()}
            </p>
          )}
          <button
            onClick={onUnlink}
            className="text-sm text-zinc-500 hover:text-error transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="you.bsky.social"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-bluesky focus:outline-none disabled:opacity-50"
          />
          <input
            type="password"
            placeholder="App password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-bluesky focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleConnect}
            disabled={loading || !handle.trim() || !appPassword.trim()}
            className="w-full rounded-lg bg-bluesky px-4 py-2.5 text-sm font-semibold text-white hover:bg-bluesky/80 disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect Bluesky'}
          </button>
          {error && <p className="text-xs text-error">{error}</p>}
        </div>
      )}
    </div>
  )
}
