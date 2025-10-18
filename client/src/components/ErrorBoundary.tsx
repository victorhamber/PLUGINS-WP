import React from 'react';
import { logDetailedError } from '@/lib/error-utils';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; errorInfo?: React.ErrorInfo }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Log específico para erros de .map()
    if (error.message.includes('.map is not a function')) {
      const context = {
        path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        time: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      };
      const { firstAppFrame } = logDetailedError('🚨 MAP ERROR DETECTED! 🚨', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack ?? undefined,
        context,
      });
      
      // Tentar extrair o nome da variável que causou o erro
      const mapErrorMatch = error.message.match(/(\w+)\.map is not a function/);
      if (mapErrorMatch) {
        console.error('🎯 VARIABLE CAUSING ERROR:', mapErrorMatch[1]);
      }
      
      // Persistir último erro para análise rápida via DevTools
      try {
        (window as any).__lastMapError = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          firstAppFrame,
          ...context,
        };
      } catch {}

      // Alertar para facilitar identificação
      alert(`🚨 ERRO .map() CAPTURADO!\n\nMensagem: ${error.message}\n\nVerifique o console para detalhes completos.`);
    }
    
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} errorInfo={this.state.errorInfo} />;
      }

      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Algo deu errado</h2>
          <details className="text-sm text-red-700">
            <summary className="cursor-pointer mb-2">Detalhes do erro</summary>
            <pre className="whitespace-pre-wrap bg-red-100 p-2 rounded text-xs overflow-auto">
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
              {'\n\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          {this.state.error?.message?.includes('.map is not a function') && (
            <div className="mt-3 text-xs text-red-800">
              <div>Rota: {typeof window !== 'undefined' ? window.location.pathname : 'unknown'}</div>
              <div>Horário: {new Date().toLocaleTimeString()}</div>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;