import { useState } from 'react'
import { useActivationStore } from '@/stores/activation'
import { useImportStore } from '@/stores/import'
import { getPlatformConfig } from '@/platforms'
import { hasNip07Extension } from '@/adapters/nostr/identity'

export default function AnnounceNostr() {
  const { pubkyId } = useActivationStore()
  const { identity } = useImportStore()
  const [published, setPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultMessage = pubkyId
    ? `I just migrated my Nostr identity to Pubky! Find me at: https://app.pubky.tech/profile/${pubkyId}\n\n#pubky #switchboard`
    : 'I just migrated to Pubky! #pubky #switchboard'

  const [message, setMessage] = useState(defaultMessage)

  const handlePublish = async () => {
    if (!hasNip07Extension()) {
      setError('No Nostr browser extension found. Install Alby or nos2x to announce back to Nostr.')
      return
    }
    if (!identity) return

    setPublishing(true)
    setError(null)

    try {
      const config = getPlatformConfig('nostr')
      if (!config) throw new Error('Nostr platform not configured')

      const result = await config.adapter.publish({
        content: message,
        identity,
      })

      if (result.success) {
        setPublished(true)
      } else {
        setError('Failed to publish to Nostr relays')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publishing failed')
    } finally {
      setPublishing(false)
    }
  }

  if (published) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-6 text-center">
        <p className="text-lg font-semibold text-success">Published to Nostr!</p>
        <p className="mt-2 text-sm text-zinc-400">
          Your followers on Nostr can now find you on Pubky.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Announce to Nostr
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-pubky focus:outline-none focus:ring-1 focus:ring-pubky text-sm resize-none"
        />
      </div>
      <button
        onClick={handlePublish}
        disabled={publishing || !message.trim()}
        className="w-full rounded-lg bg-nostr px-4 py-3 font-semibold text-white transition-colors hover:bg-nostr/80 disabled:opacity-50"
      >
        {publishing ? 'Publishing...' : '⚡ Publish to Nostr'}
      </button>
      {error && (
        <div className="rounded-lg bg-error/10 border border-error/20 p-3 text-sm text-error">
          {error}
        </div>
      )}
      <p className="text-center text-xs text-zinc-500">
        This will sign and publish a note via your Nostr browser extension.
      </p>
    </div>
  )
}
