/**
 * Two-tier React Error Boundary (Sub-phase 6.2).
 * Catches synchronous render exceptions from child components.
 * Renders a recovery UI that preserves the surrounding AppShell.
 */
import React from 'react';
import { navigate } from '../../lib/router.js';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  correlationId: string;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, correlationId: '', showDetails: false };
  }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    const correlationId = `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
      correlationId
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    // Log server-side only; never expose raw stack to the DOM
    console.error('[ErrorBoundary] Caught render error:', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, correlationId: '', showDetails: false });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const title = this.props.fallbackTitle ?? 'Something went wrong';

    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{ padding: '32px', maxWidth: '640px', margin: '40px auto' }}
      >
        <div
          style={{
            backgroundColor: '#FFF7ED',
            border: '1px solid #FED7AA',
            borderRadius: '12px',
            padding: '28px 32px'
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#C2410C',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            System Error
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0B1730', margin: '0 0 12px 0' }}>
            {title}
          </h2>

          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
            {this.state.error?.message ?? 'An unexpected error occurred in this view.'}
          </p>

          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
            The rest of the application is unaffected. You can retry this view or return to the
            overview.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '8px 20px',
                backgroundColor: '#2563EB',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => {
                this.handleReset();
                navigate('/app/overview');
              }}
              style={{
                padding: '8px 20px',
                backgroundColor: '#F1F5F9',
                color: '#334155',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Return to Overview
            </button>
            <button
              onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563EB',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px'
              }}
            >
              {this.state.showDetails ? 'Hide Diagnostic Details' : 'Show Diagnostic Details'}
            </button>
          </div>

          {this.state.showDetails && (
            <div
              style={{
                backgroundColor: '#0B1730',
                color: '#E2E8F0',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                maxHeight: '160px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap'
              }}
            >
              <div>Reference ID: {this.state.correlationId}</div>
              <div>Timestamp: {new Date().toISOString()}</div>
              {this.state.error?.stack && <div>{this.state.error.stack}</div>}
            </div>
          )}
        </div>

        <p
          style={{
            fontSize: '12px',
            color: '#94A3B8',
            marginTop: '12px',
            textAlign: 'center'
          }}
        >
          Non-clinical decision-support system. Does not affect real-time public health operations.
        </p>
      </div>
    );
  }
}
