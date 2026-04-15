import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Switchboard error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/20">
              <span className="text-3xl">!</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-zinc-100">Something went wrong</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/'
              }}
              className="mt-6 rounded-lg bg-pubky px-6 py-3 font-semibold text-white transition-colors hover:bg-pubky-dark"
            >
              Back to Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
