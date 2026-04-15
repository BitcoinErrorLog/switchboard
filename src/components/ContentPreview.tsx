import type { SwitchboardObject } from '@/core/types'

interface ContentPreviewProps {
  objects: SwitchboardObject[]
  maxDisplay?: number
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ContentPreview({ objects, maxDisplay = 10 }: ContentPreviewProps) {
  const notes = objects.filter((o) => o.kind === 'note')

  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="text-base font-semibold text-zinc-300">Recent Posts</h3>
        <p className="mt-2 text-sm text-zinc-500">No posts found.</p>
      </div>
    )
  }

  const sorted = [...notes].sort((a, b) => b.created_at - a.created_at)
  const displayed = sorted.slice(0, maxDisplay)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-zinc-300">Recent Posts</h3>
        <span className="text-sm text-zinc-500">{notes.length} total</span>
      </div>
      <div className="mt-4 space-y-3">
        {displayed.map((note) => (
          <div
            key={note.external_id}
            className="rounded-lg border border-zinc-800/50 bg-zinc-950/50 p-4"
          >
            <p className="text-sm text-zinc-300 whitespace-pre-wrap line-clamp-4">
              {note.body}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs text-zinc-500">{formatDate(note.created_at)}</span>
              {note.tags.length > 0 && (
                <div className="flex gap-1">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs text-pubky-light">#{tag}</span>
                  ))}
                </div>
              )}
              {note.reply_to && (
                <span className="text-xs text-zinc-600">↩ reply</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {notes.length > maxDisplay && (
        <p className="mt-3 text-center text-xs text-zinc-500">
          +{notes.length - maxDisplay} more posts will be imported
        </p>
      )}
    </div>
  )
}
