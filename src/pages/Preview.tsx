import { useParams, useNavigate, Link } from 'react-router-dom'
import { useImportStore } from '@/stores/import'
import ProfilePreview from '@/components/ProfilePreview'
import GraphPreview from '@/components/GraphPreview'
import ContentPreview from '@/components/ContentPreview'
import TagSuggestions from '@/components/TagSuggestions'

export default function Preview() {
  const { platform } = useParams<{ platform: string }>()
  const navigate = useNavigate()
  const { identity, objects, edges, tagFrequencies, step } = useImportStore()

  if (step !== 'done' || !identity) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">No import data found.</p>
          <Link to={`/${platform}/import`} className="mt-4 inline-block text-pubky-light hover:underline">
            Start import
          </Link>
        </div>
      </div>
    )
  }

  const follows = edges.filter((e) => e.edge_kind === 'follows')
  const notes = objects.filter((o) => o.kind === 'note')

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <Link
          to={`/${platform}/import`}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back to import
        </Link>

        <h2 className="mt-6 text-2xl font-bold text-zinc-100">Preview Your Import</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Here's what will be migrated to your new Pubky account.
        </p>

        <div className="mt-8 space-y-6">
          <ProfilePreview identity={identity} />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-2xl font-bold text-zinc-100">{follows.length}</p>
              <p className="text-xs text-zinc-500 mt-1">Following</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-2xl font-bold text-zinc-100">{notes.length}</p>
              <p className="text-xs text-zinc-500 mt-1">Posts</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-2xl font-bold text-zinc-100">{tagFrequencies.size}</p>
              <p className="text-xs text-zinc-500 mt-1">Tags</p>
            </div>
          </div>

          <GraphPreview edges={edges} />
          <ContentPreview objects={objects} />
          <TagSuggestions tagFrequencies={tagFrequencies} />
        </div>

        <div className="mt-10 flex gap-3">
          <Link
            to={`/${platform}/import`}
            className="flex-1 rounded-xl border border-zinc-700 px-6 py-4 text-center font-semibold text-zinc-300 transition-colors hover:border-zinc-600"
          >
            Re-import
          </Link>
          <button
            onClick={() => navigate(`/${platform}/verify`)}
            className="flex-1 rounded-xl bg-pubky px-6 py-4 font-semibold text-white transition-colors hover:bg-pubky-dark"
          >
            Continue to Verification
          </button>
        </div>
      </div>
    </div>
  )
}
