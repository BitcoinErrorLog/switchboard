import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getPlatformRegistry, type PlatformConfig } from '@/platforms'
import type { PlatformId } from '@/core/types'
import { useImportStore } from '@/stores/import'

export default function Import() {
  const { platform } = useParams<{ platform: string }>()
  const navigate = useNavigate()
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const store = useImportStore()

  useEffect(() => {
    getPlatformRegistry().then((registry) => {
      const cfg = registry.get(platform as PlatformId)
      if (cfg) {
        setConfig(cfg)
        store.setPlatform(cfg.slug)
      }
    })
  }, [platform])

  useEffect(() => {
    if (store.identity && store.identity.verification_state === 'verified' && store.step === 'identifying') {
      handleBackfill()
    }
  }, [store.identity, store.step])

  useEffect(() => {
    if (store.step === 'done') {
      navigate(`/${platform}/preview`)
    }
  }, [store.step, platform, navigate])

  const handleBackfill = async () => {
    if (!config || !store.identity) return
    store.setStep('fetching')

    try {
      const result = await config.adapter.backfill({
        identity: store.identity,
        limit: 200,
      })
      store.setImportData({
        objects: result.objects,
        edges: result.edges,
        checkpoint: result.checkpoint,
        tagFrequencies: result.tag_frequencies,
      })
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Import failed')
    }
  }

  if (!config) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    )
  }

  const IdentifyComponent = config.IdentifyComponent
  if (!IdentifyComponent) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link
          to={`/${platform}`}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back
        </Link>

        <h2 className="mt-6 text-2xl font-bold text-zinc-100">
          Import from {config.name}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Identify your account to begin importing your data.
        </p>

        {store.step === 'fetching' && (
          <div className="mt-8 flex flex-col items-center gap-4 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-pubky border-t-transparent" />
            <p className="text-sm text-zinc-400">Fetching your data from {config.name} relays...</p>
            <p className="text-xs text-zinc-600">This may take a few seconds.</p>
          </div>
        )}

        {store.step === 'error' && (
          <div className="mt-8 space-y-4">
            <div className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error">
              {store.error}
            </div>
            <button
              onClick={() => store.reset()}
              className="w-full rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:border-zinc-600"
            >
              Try Again
            </button>
          </div>
        )}

        {(store.step === 'idle' || store.step === 'identifying') && (
          <div className="mt-8">
            <IdentifyComponent />
          </div>
        )}
      </div>
    </div>
  )
}
