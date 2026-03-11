import { Component } from 'react'
import { RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
              <RefreshCw className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Algo deu errado</h2>
            <p className="text-gray-400 text-sm">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-card-hover border border-border rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
              >
                Tentar novamente
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-sm text-white font-medium transition-colors"
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
