import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPlatformRegistry, type PlatformConfig } from '@/platforms'
import type { PlatformId } from '@/core/types'
import { useImportStore } from '@/stores/import'

export default function Landing() {
  const { platform } = useParams<{ platform: string }>()
  const navigate = useNavigate()
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const setPlatform = useImportStore((s) => s.setPlatform)

  useEffect(() => {
    getPlatformRegistry().then((registry) => {
      const cfg = registry.get(platform as PlatformId)
      if (cfg) {
        setConfig(cfg)
        setPlatform(cfg.slug)
      }
    })
  }, [platform, setPlatform])

  if (!config) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-zinc-400">Platform not found.</p>
          <Link to="/" className="mt-4 inline-block text-pubky-light hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <span className="text-6xl">{config.icon}</span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          {config.landingCopy.headline}
        </h1>
        <p className="mt-4 text-lg text-zinc-400">
          {config.landingCopy.subhead}
        </p>

        <button
          onClick={() => navigate(`/${platform}/import`)}
          className="mt-8 w-full rounded-xl bg-pubky px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-pubky-dark"
        >
          {config.landingCopy.cta}
        </button>

        <div className="mt-8 space-y-3 text-left">
          <div className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-4">
            <span className="text-success mt-0.5">✓</span>
            <div>
              <p className="text-sm font-medium text-zinc-200">Import your profile</p>
              <p className="text-xs text-zinc-500">Name, bio, avatar, and links</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-4">
            <span className="text-success mt-0.5">✓</span>
            <div>
              <p className="text-sm font-medium text-zinc-200">Bring your people</p>
              <p className="text-xs text-zinc-500">Follow list imported automatically</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-4">
            <span className="text-success mt-0.5">✓</span>
            <div>
              <p className="text-sm font-medium text-zinc-200">Move your content</p>
              <p className="text-xs text-zinc-500">Posts and tags, preserved</p>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Choose a different platform
        </Link>
      </div>
    </div>
  )
}
