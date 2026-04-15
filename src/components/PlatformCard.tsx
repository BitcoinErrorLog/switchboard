import { Link } from 'react-router-dom'

interface PlatformCardProps {
  slug: string
  name: string
  icon: string
  available: boolean
}

export default function PlatformCard({ slug, name, icon, available }: PlatformCardProps) {
  if (!available) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 opacity-50">
        <span className="text-4xl">{icon}</span>
        <span className="text-lg font-semibold text-zinc-400">{name}</span>
        <span className="text-xs text-zinc-600 uppercase tracking-wider">Coming Soon</span>
      </div>
    )
  }

  return (
    <Link
      to={`/${slug}`}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-8 transition-all hover:border-pubky hover:bg-zinc-800/80 hover:shadow-lg hover:shadow-pubky/10"
    >
      <span className="text-4xl">{icon}</span>
      <span className="text-lg font-semibold text-zinc-100">{name}</span>
      <span className="text-xs text-pubky-light uppercase tracking-wider">Import Now</span>
    </Link>
  )
}
