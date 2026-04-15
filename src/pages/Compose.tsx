import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useComposerStore, PLATFORM_CHAR_LIMITS, PUBKY_SHORT_LIMIT } from '@/stores/composer'
import { useAccountsStore } from '@/stores/accounts'
import { getPlatformConfig } from '@/platforms'
import { writeJson } from '@/lib/pubky'
import { getSession } from '@/lib/pubky-session'
import { mapObjectToPost } from '@/core/mapper'
import type { PlatformId, SwitchboardObject } from '@/core/types'

const PLATFORM_ICONS: Record<string, string> = {
  nostr: '⚡',
  bluesky: '🦋',
}

export default function Compose() {
  const composer = useComposerStore()
  const { accounts } = useAccountsStore()

  const linkedPlatforms = Array.from(accounts.values())
    .filter((a) => a.connected)
    .map((a) => a.platform)

  useEffect(() => {
    const initial = new Set<PlatformId>(linkedPlatforms)
    composer.setTargets(initial)
  }, [linkedPlatforms.join(',')])

  const graphemeCount = [...composer.content].length
  const minLimit = getMinCharLimit(composer.targets)
  const overLimit = graphemeCount > minLimit

  const allDone = linkedPlatforms.length > 0 &&
    Array.from(composer.targets).every(
      (p) => composer.status.get(p) === 'success',
    )

  const isPublishing = Array.from(composer.status.values()).some(
    (s) => s === 'publishing',
  )

  const handlePublish = async () => {
    if (!composer.content.trim() || overLimit) return

    const now = Math.floor(Date.now() / 1000)

    const pubkySession = await getSession()
    if (pubkySession) {
      const canonical: SwitchboardObject = {
        platform: 'nostr' as PlatformId,
        external_id: '',
        canonical_object_id: `pubky:${Date.now()}`,
        author_identity_ref: pubkySession.pubkyId,
        kind: 'note',
        body: composer.content,
        media_refs: [],
        canonical_url: null,
        created_at: now,
        updated_at: now,
        visibility: 'public',
        reply_to: null,
        quote_of: null,
        repost_of: null,
        tags: [],
        source_payload_ref: '',
      }

      const mapped = mapObjectToPost(canonical, pubkySession.pubkyId)
      if (mapped) {
        try {
          await writeJson(
            pubkySession.session,
            mapped.path as `/pub/${string}`,
            mapped.json,
          )
        } catch {
          // pubky write failure doesn't block external publishes
        }
      }
    }

    const publishPromises = Array.from(composer.targets).map(async (platform) => {
      const config = getPlatformConfig(platform)
      const account = accounts.get(platform)
      if (!config || !account) return

      composer.setStatus(platform, 'publishing')

      try {
        const result = await config.adapter.publish({
          content: composer.content,
          identity: account.identity,
        })

        if (result.success) {
          composer.setResult(platform, {
            external_id: result.external_id,
            url: result.url,
          })
        } else {
          composer.setError(platform, 'Publish failed')
        }
      } catch (err) {
        composer.setError(
          platform,
          err instanceof Error ? err.message : 'Publish failed',
        )
      }
    })

    await Promise.allSettled(publishPromises)
  }

  if (linkedPlatforms.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">No accounts linked yet.</p>
          <Link to="/accounts" className="mt-4 inline-block text-pubky-light hover:underline">
            Link an account
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-bold text-zinc-100 mb-6">Compose</h2>

        <textarea
          value={composer.content}
          onChange={(e) => composer.setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={6}
          disabled={isPublishing}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-pubky focus:outline-none focus:ring-1 focus:ring-pubky text-sm resize-none disabled:opacity-50"
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-4">
            {linkedPlatforms.map((p) => {
              const limit = PLATFORM_CHAR_LIMITS[p] ?? PUBKY_SHORT_LIMIT
              const count = graphemeCount
              const over = count > limit
              return (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={composer.targets.has(p)}
                    onChange={() => composer.toggleTarget(p)}
                    disabled={isPublishing}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-pubky focus:ring-pubky"
                  />
                  <span className="text-sm text-zinc-300">
                    {PLATFORM_ICONS[p] || ''} {p}
                  </span>
                  <span className={`text-xs ${over ? 'text-error' : 'text-zinc-500'}`}>
                    {count}/{limit}
                  </span>
                </label>
              )
            })}
          </div>

          <button
            onClick={handlePublish}
            disabled={isPublishing || !composer.content.trim() || overLimit}
            className="rounded-lg bg-pubky px-6 py-2.5 font-semibold text-white transition-colors hover:bg-pubky-dark disabled:opacity-50"
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>

        {(composer.status.size > 0) && (
          <div className="mt-6 space-y-2">
            {Array.from(composer.targets).map((p) => {
              const status = composer.status.get(p)
              const error = composer.errors.get(p)
              const result = composer.results.get(p)

              return (
                <div key={p} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                  <span className="text-sm">{PLATFORM_ICONS[p] || p}</span>
                  {status === 'publishing' && (
                    <span className="text-sm text-zinc-400">Publishing...</span>
                  )}
                  {status === 'success' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-success">Published</span>
                      {result?.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-zinc-500 hover:text-zinc-300"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  )}
                  {status === 'error' && (
                    <span className="text-sm text-error">{error || 'Failed'}</span>
                  )}
                  {!status && (
                    <span className="text-sm text-zinc-500">Ready</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {allDone && (
          <div className="mt-6 text-center">
            <button
              onClick={() => composer.reset()}
              className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm text-zinc-300 hover:border-zinc-600"
            >
              Compose Another
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function getMinCharLimit(targets: Set<PlatformId>): number {
  let min = PUBKY_SHORT_LIMIT
  for (const p of targets) {
    const limit = PLATFORM_CHAR_LIMITS[p]
    if (limit && limit < min) min = limit
  }
  return min
}
