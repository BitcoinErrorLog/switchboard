import { useEffect, useState } from 'react'
import PlatformCard from '@/components/PlatformCard'
import { getPlatformRegistry, COMING_SOON_PLATFORMS, type PlatformConfig } from '@/platforms'

export default function Home() {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([])

  useEffect(() => {
    getPlatformRegistry().then((registry) => {
      setPlatforms([...registry.values()])
    })
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl">
          Switch to <span className="text-pubky">Pubky</span>
        </h1>
        <p className="mt-4 text-lg text-zinc-400">
          Bring your profile, your people, and your posts from any network.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {platforms.map((p) => (
            <PlatformCard
              key={p.slug}
              slug={p.slug}
              name={p.name}
              icon={p.icon}
              available={p.available}
            />
          ))}
          {COMING_SOON_PLATFORMS.map((p) => (
            <PlatformCard
              key={p.slug}
              slug={p.slug}
              name={p.name}
              icon={p.icon}
              available={false}
            />
          ))}
        </div>

        <p className="mt-12 text-sm text-zinc-600">
          More platforms coming soon. Switchboard is open source.
        </p>
      </div>
    </div>
  )
}
