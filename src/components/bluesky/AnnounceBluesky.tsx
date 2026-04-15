import { useState } from 'react'
import { publishPost } from '@/adapters/bluesky/publisher'
import { hasSession } from '@/adapters/bluesky/client'

export default function AnnounceBluesky() {
  const [content, setContent] = useState(
    'I just bridged my Bluesky account to Pubky via Switchboard! 🦋➡️🔑\n\nhttps://switch.pubky.org',
  )
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    uri: string | null
  } | null>(null)

  if (!hasSession()) {
    return (
      <div className="rounded-lg border border-zinc-800 p-4 text-sm text-zinc-500">
        No active Bluesky session. Log in first to announce.
      </div>
    )
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const res = await publishPost(content)
      setResult({ success: res.success, uri: res.uri })
    } catch {
      setResult({ success: false, uri: null })
    } finally {
      setPublishing(false)
    }
  }

  if (result?.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-sm text-success">
          Posted to Bluesky!
        </div>
        {result.uri && (
          <a
            href={uriToUrl(result.uri)}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-bluesky hover:underline"
          >
            View on Bluesky →
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={300}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-bluesky focus:outline-none focus:ring-1 focus:ring-bluesky text-sm resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{content.length}/300</span>
        <button
          onClick={handlePublish}
          disabled={publishing || !content.trim()}
          className="rounded-lg bg-bluesky px-6 py-2.5 font-semibold text-white transition-colors hover:bg-bluesky/80 disabled:opacity-50"
        >
          {publishing ? 'Posting...' : 'Post to Bluesky'}
        </button>
      </div>
    </div>
  )
}

function uriToUrl(uri: string): string {
  const parts = uri.split('/')
  const rkey = parts[parts.length - 1]
  const did = parts[2]
  return `https://bsky.app/profile/${did}/post/${rkey}`
}
