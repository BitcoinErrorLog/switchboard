import { useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useReaderStore } from '@/stores/reader'
import { useAccountsStore } from '@/stores/accounts'
import { getPlatformConfig } from '@/platforms'
import type { PlatformId, SwitchboardObject } from '@/core/types'

const PLATFORM_BADGES: Record<string, { label: string; className: string }> = {
  nostr: { label: '⚡ Nostr', className: 'bg-nostr/20 text-nostr' },
  bluesky: { label: '🦋 Bluesky', className: 'bg-bluesky/20 text-bluesky' },
  pubky: { label: '🔑 Pubky', className: 'bg-pubky/20 text-pubky-light' },
}

export default function Reader() {
  const reader = useReaderStore()
  const { accounts } = useAccountsStore()
  const loadingRef = useRef(false)

  const linkedPlatforms = Array.from(accounts.values())
    .filter((a) => a.connected)
    .map((a) => a.platform)

  const loadFeed = useCallback(async (platforms: PlatformId[], loadMore = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    reader.setLoading(true)

    const promises = platforms.map(async (platform) => {
      const config = getPlatformConfig(platform)
      if (!config?.adapter.fetchFeed) return

      const account = accounts.get(platform)
      if (!account) return

      const cursor = loadMore ? reader.cursors.get(platform) ?? null : null

      try {
        const result = await config.adapter.fetchFeed({
          identity: account.identity,
          cursor,
          limit: 30,
        })

        reader.addItems(result.objects)
        reader.setCursor(platform, result.cursor)
        reader.setHasMore(platform, result.has_more)
      } catch {
        // silently skip failed platforms
      }
    })

    await Promise.allSettled(promises)
    reader.setLoading(false)
    loadingRef.current = false
  }, [accounts, reader])

  useEffect(() => {
    if (linkedPlatforms.length > 0) {
      reader.reset()
      loadFeed(linkedPlatforms)
    }
  }, [linkedPlatforms.join(',')])

  const filteredItems = reader.filter === 'all'
    ? reader.items
    : reader.items.filter((item) => item.platform === reader.filter)

  const canLoadMore = Array.from(reader.hasMore.values()).some(Boolean)

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-100">Feed</h2>
          <div className="flex gap-2">
            <FilterButton
              active={reader.filter === 'all'}
              onClick={() => reader.setFilter('all')}
            >
              All
            </FilterButton>
            {linkedPlatforms.map((p) => (
              <FilterButton
                key={p}
                active={reader.filter === p}
                onClick={() => reader.setFilter(p)}
              >
                {PLATFORM_BADGES[p]?.label || p}
              </FilterButton>
            ))}
          </div>
        </div>

        {reader.loading && reader.items.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-pubky border-t-transparent" />
            <span className="ml-3 text-sm text-zinc-400">Loading feed...</span>
          </div>
        )}

        <div className="space-y-4">
          {filteredItems.map((item) => (
            <FeedItem key={item.canonical_object_id} item={item} />
          ))}
        </div>

        {canLoadMore && !reader.loading && (
          <div className="mt-6 text-center">
            <button
              onClick={() => loadFeed(linkedPlatforms, true)}
              className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm text-zinc-300 hover:border-zinc-600"
            >
              Load more
            </button>
          </div>
        )}

        {reader.loading && reader.items.length > 0 && (
          <div className="mt-6 flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-pubky border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  )
}

function FeedItem({ item }: { item: SwitchboardObject }) {
  const badge = PLATFORM_BADGES[item.platform] || { label: item.platform, className: 'bg-zinc-700 text-zinc-300' }
  const date = new Date(item.created_at * 1000)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>
        <span className="text-xs text-zinc-500" title={date.toISOString()}>
          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">{item.body}</p>
      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              #{tag}
            </span>
          ))}
        </div>
      )}
      {item.canonical_url && (
        <a
          href={item.canonical_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-xs text-zinc-500 hover:text-zinc-300"
        >
          View original →
        </a>
      )}
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-pubky text-white'
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
      }`}
    >
      {children}
    </button>
  )
}
