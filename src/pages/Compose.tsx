import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useComposerStore, PLATFORM_CHAR_LIMITS, PUBKY_SHORT_LIMIT } from '@/stores/composer'
import { useAccountsStore } from '@/stores/accounts'
import { getPlatformConfig } from '@/platforms'
import { writeJson } from '@/lib/pubky'
import { getSession, hasPersisted } from '@/lib/pubky-session'
import { mapObjectToPost } from '@/core/mapper'
import type { PlatformId, SwitchboardObject } from '@/core/types'

const PLATFORM_ICONS: Record<string, string> = {
  pubky: '🔑',
  nostr: '⚡',
  bluesky: '🦋',
}

type TargetStatus = 'idle' | 'publishing' | 'success' | 'error'

interface TargetState {
  status: TargetStatus
  error: string | null
  url: string | null
}

export default function Compose() {
  const composer = useComposerStore()
  const { accounts } = useAccountsStore()
  const pubkyConnected = hasPersisted()

  const externalPlatforms = Array.from(accounts.values())
    .filter((a) => a.connected)
    .map((a) => a.platform)

  const allTargets: string[] = []
  if (pubkyConnected) allTargets.push('pubky')
  allTargets.push(...externalPlatforms)

  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set(allTargets))
  const [targetStates, setTargetStates] = useState<Map<string, TargetState>>(new Map())

  useEffect(() => {
    setSelectedTargets(new Set(allTargets))
  }, [allTargets.join(',')])

  const toggleTarget = (t: string) => {
    setSelectedTargets((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const graphemeCount = [...composer.content].length
  const minLimit = getMinCharLimit(selectedTargets, externalPlatforms)
  const overLimit = graphemeCount > minLimit

  const isPublishing = Array.from(targetStates.values()).some(
    (s) => s.status === 'publishing',
  )

  const allDone = allTargets.length > 0 &&
    Array.from(selectedTargets).every((t) => {
      const s = targetStates.get(t)
      return s?.status === 'success'
    }) &&
    targetStates.size > 0

  const setTarget = (id: string, state: Partial<TargetState>) => {
    setTargetStates((prev) => {
      const next = new Map(prev)
      const existing = next.get(id) || { status: 'idle' as TargetStatus, error: null, url: null }
      next.set(id, { ...existing, ...state })
      return next
    })
  }

  const handlePublish = async () => {
    if (!composer.content.trim() || overLimit || selectedTargets.size === 0) return

    const now = Math.floor(Date.now() / 1000)
    const promises: Promise<void>[] = []

    if (selectedTargets.has('pubky')) {
      setTarget('pubky', { status: 'publishing', error: null })
      promises.push(
        (async () => {
          try {
            const pubkySession = await getSession()
            if (!pubkySession) {
              setTarget('pubky', { status: 'error', error: 'Session expired — reconnect on Accounts page' })
              return
            }
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
              await writeJson(
                pubkySession.session,
                mapped.path as `/pub/${string}`,
                mapped.json,
              )
            }
            setTarget('pubky', { status: 'success' })
          } catch (err) {
            setTarget('pubky', { status: 'error', error: err instanceof Error ? err.message : 'Failed' })
          }
        })(),
      )
    }

    for (const platform of selectedTargets) {
      if (platform === 'pubky') continue
      const config = getPlatformConfig(platform as PlatformId)
      const account = accounts.get(platform as PlatformId)
      if (!config || !account) continue

      setTarget(platform, { status: 'publishing', error: null })
      promises.push(
        (async () => {
          try {
            const result = await config.adapter.publish({
              content: composer.content,
              identity: account.identity,
            })
            if (result.success) {
              setTarget(platform, { status: 'success', url: result.url })
            } else {
              setTarget(platform, { status: 'error', error: 'Publish failed' })
            }
          } catch (err) {
            setTarget(platform, { status: 'error', error: err instanceof Error ? err.message : 'Failed' })
          }
        })(),
      )
    }

    await Promise.allSettled(promises)
  }

  const handleReset = () => {
    composer.reset()
    setTargetStates(new Map())
  }

  if (allTargets.length === 0) {
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
          <div className="flex flex-wrap gap-4">
            {allTargets.map((t) => {
              const limit = t === 'pubky'
                ? PUBKY_SHORT_LIMIT
                : (PLATFORM_CHAR_LIMITS[t as PlatformId] ?? PUBKY_SHORT_LIMIT)
              const over = graphemeCount > limit
              return (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTargets.has(t)}
                    onChange={() => toggleTarget(t)}
                    disabled={isPublishing}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-pubky focus:ring-pubky"
                  />
                  <span className="text-sm text-zinc-300">
                    {PLATFORM_ICONS[t] || ''} {t}
                  </span>
                  <span className={`text-xs ${over ? 'text-error' : 'text-zinc-500'}`}>
                    {graphemeCount}/{limit}
                  </span>
                </label>
              )
            })}
          </div>

          <button
            onClick={handlePublish}
            disabled={isPublishing || !composer.content.trim() || overLimit || selectedTargets.size === 0}
            className="rounded-lg bg-pubky px-6 py-2.5 font-semibold text-white transition-colors hover:bg-pubky-dark disabled:opacity-50"
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>

        {targetStates.size > 0 && (
          <div className="mt-6 space-y-2">
            {allTargets
              .filter((t) => targetStates.has(t))
              .map((t) => {
                const state = targetStates.get(t)!
                return (
                  <div key={t} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                    <span className="text-sm">{PLATFORM_ICONS[t] || t}</span>
                    {state.status === 'publishing' && (
                      <span className="text-sm text-zinc-400">Publishing...</span>
                    )}
                    {state.status === 'success' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-success">Published</span>
                        {state.url && (
                          <a
                            href={state.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-500 hover:text-zinc-300"
                          >
                            View →
                          </a>
                        )}
                      </div>
                    )}
                    {state.status === 'error' && (
                      <span className="text-sm text-error">{state.error || 'Failed'}</span>
                    )}
                  </div>
                )
              })}
          </div>
        )}

        {allDone && (
          <div className="mt-6 text-center">
            <button
              onClick={handleReset}
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

function getMinCharLimit(targets: Set<string>, externalPlatforms: PlatformId[]): number {
  let min = PUBKY_SHORT_LIMIT
  for (const t of targets) {
    if (t === 'pubky') continue
    const limit = PLATFORM_CHAR_LIMITS[t as PlatformId]
    if (limit && limit < min) min = limit
  }
  return min
}
