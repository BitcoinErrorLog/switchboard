import { useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useAccountsStore } from '@/stores/accounts'
import { loadSecretKeyFromHex } from '@/adapters/nostr/signer'
import { resumeSession as resumeBlueskySession } from '@/adapters/bluesky/client'

const NAV_LINKS = [
  { to: '/reader', label: 'Feed' },
  { to: '/compose', label: 'Compose' },
  { to: '/accounts', label: 'Accounts' },
]

export default function App() {
  const location = useLocation()
  const nostrAccount = useAccountsStore((s) => s.accounts.get('nostr'))
  const blueskyAccount = useAccountsStore((s) => s.accounts.get('bluesky'))

  useEffect(() => {
    const hexSecret = nostrAccount?.sessionData?.secretKeyHex as string | undefined
    if (hexSecret) {
      loadSecretKeyFromHex(hexSecret)
    }
  }, [nostrAccount?.sessionData?.secretKeyHex])

  useEffect(() => {
    const sd = blueskyAccount?.sessionData
    if (sd?.accessJwt && sd?.refreshJwt && sd?.handle && sd?.did) {
      resumeBlueskySession({
        accessJwt: sd.accessJwt as string,
        refreshJwt: sd.refreshJwt as string,
        handle: sd.handle as string,
        did: sd.did as string,
      }).catch(() => {})
    }
  }, [blueskyAccount?.sessionData?.did])

  return (
    <ErrorBoundary>
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800/50 px-6 py-4">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2 text-zinc-100 hover:text-pubky-light transition-colors">
              <span className="text-xl font-bold tracking-tight">
                <span className="text-pubky">Switch</span>board
              </span>
            </a>
            <nav className="hidden sm:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    location.pathname === link.to
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <a
            href="https://pubky.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            pubky.tech
          </a>
        </header>
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
        <footer className="border-t border-zinc-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">
              Switchboard — Your data, your network, your choice.
            </span>
            <nav className="flex sm:hidden items-center gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-xs transition-colors ${
                    location.pathname === link.to
                      ? 'text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
