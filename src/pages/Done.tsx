import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useActivationStore } from '@/stores/activation'
import { useImportStore } from '@/stores/import'
import { getPlatformRegistry, type PlatformConfig } from '@/platforms'
import type { PlatformId } from '@/core/types'

export default function Done() {
  const { platform } = useParams<{ platform: string }>()
  const activation = useActivationStore()
  const importStore = useImportStore()
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getPlatformRegistry().then((registry) => {
      const cfg = registry.get(platform as PlatformId)
      if (cfg) setConfig(cfg)
    })
  }, [platform])

  const profileUrl = activation.pubkyId
    ? `https://app.pubky.tech/profile/${activation.pubkyId}`
    : null

  const handleCopyLink = () => {
    if (profileUrl) {
      navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (!profileUrl) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Pubky Profile',
          text: 'I just migrated to Pubky! Check out my profile.',
          url: profileUrl,
        })
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink()
    }
  }

  if (activation.step !== 'complete' || !activation.pubkyId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Complete activation first.</p>
          <Link to={`/${platform}/activate`} className="mt-4 inline-block text-pubky-light hover:underline">
            Go to activation
          </Link>
        </div>
      </div>
    )
  }

  const AnnounceComponent = config?.AnnounceComponent

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-zinc-100">Welcome to Pubky!</h2>
          <p className="mt-3 text-zinc-400">
            Your account is live. Your data has been imported.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Your Pubky ID</p>
            <p className="text-sm text-zinc-300 font-mono break-all">{activation.pubkyId}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
              <p className="text-lg font-bold text-success">✓</p>
              <p className="text-xs text-zinc-500">Profile</p>
            </div>
            <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
              <p className="text-lg font-bold text-zinc-100">{activation.followsWritten}</p>
              <p className="text-xs text-zinc-500">Follows</p>
            </div>
            <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3">
              <p className="text-lg font-bold text-zinc-100">{activation.postsWritten}</p>
              <p className="text-xs text-zinc-500">Posts</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-pubky px-6 py-4 text-center font-semibold text-white transition-colors hover:bg-pubky-dark"
            >
              View My Pubky Profile
            </a>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCopyLink}
              className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-600"
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-600"
            >
              Share
            </button>
          </div>
        </div>

        {AnnounceComponent && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              Let your {config?.name} followers know
            </h3>
            <AnnounceComponent />
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to="/"
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            ← Import from another platform
          </Link>
        </div>
      </div>
    </div>
  )
}
