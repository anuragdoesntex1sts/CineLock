import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="card max-w-md w-full p-8 text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-danger/10 text-danger mb-2">
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
            </div>
            <h2 className="text-h2 font-semibold text-text-primary">Something went wrong</h2>
            <p className="text-body text-text-secondary">
              {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button onClick={this.handleReset} variant="primary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
              <Button onClick={() => { window.location.href = '/' }} variant="secondary">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

