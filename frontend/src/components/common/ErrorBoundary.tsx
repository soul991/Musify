import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh] select-none">
          <div className="w-16 h-16 rounded-2xl bg-[#E5303D]/10 border border-[#E5303D]/20 flex items-center justify-center mb-5 text-[#E5303D]">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-sm text-white/50 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred while rendering this section. Your playback state and library are safe.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors flex items-center gap-2 border border-white/5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-[#E5303D] hover:bg-[#B8222E] text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-[#E5303D]/20"
            >
              <Home className="w-3.5 h-3.5" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
