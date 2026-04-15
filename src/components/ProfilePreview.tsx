import type { SwitchboardIdentity } from '@/core/types'

interface ProfilePreviewProps {
  identity: SwitchboardIdentity
}

export default function ProfilePreview({ identity }: ProfilePreviewProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      {identity.avatar_url ? (
        <img
          src={identity.avatar_url}
          alt={identity.display_name ?? 'Profile'}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-zinc-700"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-zinc-700">
          <span className="text-2xl text-zinc-500">?</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-zinc-100 truncate">
          {identity.display_name || 'Anonymous'}
        </h3>
        {identity.handle && (
          <p className="text-sm text-zinc-400 truncate">{identity.handle}</p>
        )}
        {identity.bio && (
          <p className="mt-2 text-sm text-zinc-300 line-clamp-3">{identity.bio}</p>
        )}
        {identity.links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {identity.links.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pubky-light hover:underline truncate max-w-48"
              >
                {new URL(link).hostname}
              </a>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            identity.verification_state === 'verified'
              ? 'bg-success/20 text-success'
              : identity.verification_state === 'claimed'
                ? 'bg-warning/20 text-warning'
                : 'bg-zinc-700 text-zinc-400'
          }`}>
            {identity.verification_state === 'verified' ? '✓ Verified' : identity.verification_state === 'claimed' ? '◉ Claimed' : 'Unverified'}
          </span>
          <span className="text-xs text-zinc-500 uppercase">{identity.platform}</span>
        </div>
      </div>
    </div>
  )
}
