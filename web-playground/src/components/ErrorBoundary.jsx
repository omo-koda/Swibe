import React from 'react'
import { captureError } from '../utils/sentry'
import { trackError } from '../utils/analytics'

/**
 * Generic error boundary with recovery UI.
 * Wraps crypto-heavy sections (Generator, CloakSeed, PoisonRadar).
 *
 * Props:
 *  - fallbackTitle: heading shown on error (default: "Something went wrong")
 *  - onReset: optional callback fired when user clicks "Try again"
 *  - children: normal render tree
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    captureError(error, { component: this.props.fallbackTitle || 'ErrorBoundary', errorInfo })
    trackError('component_crash', error.message || 'Unknown error')
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Something went wrong'
      const message = this.state.error?.message || 'An unexpected error occurred'

      // Detect common crypto / worker failures
      const isCryptoError = /subtle|crypto|worker|wasm/i.test(message)

      return (
        <div className="card border border-red-500/30 bg-red-500/5">
          <div className="text-center py-6 space-y-4">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-xl font-bold text-red-400">{title}</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">{message}</p>

            {isCryptoError && (
              <div className="bg-gray-800 rounded-lg p-4 text-left text-sm text-gray-300 max-w-md mx-auto space-y-2">
                <p className="font-semibold text-yellow-400">Possible causes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Browser does not support Web Crypto API</li>
                  <li>Web Workers are blocked by CSP or browser settings</li>
                  <li>SharedArrayBuffer not available (requires HTTPS + COOP/COEP headers)</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  The app will fall back to single-threaded mode automatically.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
            </div>

            {this.state.errorInfo && (
              <details className="text-left text-xs text-gray-500 max-w-md mx-auto mt-4">
                <summary className="cursor-pointer hover:text-gray-400">Stack trace</summary>
                <pre className="mt-2 overflow-auto max-h-40 p-2 bg-gray-900 rounded text-[10px]">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
