import { Outlet } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800/50 px-6 py-4">
          <a href="/" className="flex items-center gap-2 text-zinc-100 hover:text-pubky-light transition-colors">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-pubky">Switch</span>board
            </span>
          </a>
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
        <footer className="border-t border-zinc-800/50 px-6 py-4 text-center text-xs text-zinc-600">
          Switchboard — Your data, your network, your choice.
        </footer>
      </div>
    </ErrorBoundary>
  )
}
