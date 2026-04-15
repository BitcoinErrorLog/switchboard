import type { SwitchboardEdge } from '@/core/types'
import { lookupPubkyId } from '@/lib/identity-links'

interface GraphPreviewProps {
  edges: SwitchboardEdge[]
}

export default function GraphPreview({ edges }: GraphPreviewProps) {
  const follows = edges.filter((e) => e.edge_kind === 'follows')

  if (follows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="text-base font-semibold text-zinc-300">Following</h3>
        <p className="mt-2 text-sm text-zinc-500">No follow data found.</p>
      </div>
    )
  }

  const onPubky = follows.filter((e) => lookupPubkyId(e.platform, e.target_ref))
  const notOnPubky = follows.filter((e) => !lookupPubkyId(e.platform, e.target_ref))

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-zinc-300">Following</h3>
        <span className="text-sm text-zinc-500">{follows.length} accounts</span>
      </div>

      {onPubky.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-success uppercase tracking-wider mb-2">
            On Pubky ({onPubky.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {onPubky.slice(0, 20).map((edge, i) => (
              <span
                key={i}
                className="rounded-full bg-success/10 px-2.5 py-1 text-xs text-success border border-success/20"
              >
                {edge.target_ref.slice(0, 8)}…
              </span>
            ))}
            {onPubky.length > 20 && (
              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                +{onPubky.length - 20} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
          Not yet on Pubky ({notOnPubky.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {notOnPubky.slice(0, 20).map((edge, i) => (
            <span
              key={i}
              className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400"
            >
              {edge.target_ref.slice(0, 8)}…
            </span>
          ))}
          {notOnPubky.length > 20 && (
            <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
              +{notOnPubky.length - 20} more
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
