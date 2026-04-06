import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      let isFirestoreError = false;
      
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed && parsed.error && parsed.operationType) {
          isFirestoreError = true;
          errorMessage = `Database Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path || 'unknown path'}`;
        }
      } catch (e) {
        // Not a JSON error string
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-surface-container-lowest rounded-2xl shadow-xl p-8 text-center border border-outline-variant">
            <div className="w-16 h-16 bg-error-container text-on-error-container rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-4">Something went wrong</h2>
            <p className="text-on-surface-variant mb-6 text-sm">
              {isFirestoreError 
                ? "We encountered a permissions or database error. Please check your access rights."
                : errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-on-secondary-fixed text-white rounded-xl py-3 font-medium hover:bg-on-secondary-fixed/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
