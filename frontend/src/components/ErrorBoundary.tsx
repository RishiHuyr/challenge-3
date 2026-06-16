import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught boundary error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            textAlign: 'center'
          }}
          role="alert"
          aria-live="assertive"
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '500px',
              width: '100%',
              border: '2px solid var(--danger-color)',
              padding: '2.5rem'
            }}
          >
            <span
              style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}
              role="img"
              aria-label="Danger shield warning"
            >
              ⚠️
            </span>
            <h1 style={{ marginBottom: '1rem', fontSize: '1.8rem' }}>Something went wrong</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              We encountered a rendering error. Our engineering team has been notified.
            </p>
            {this.state.error && (
              <pre
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  overflowX: 'auto',
                  textAlign: 'left',
                  marginBottom: '2rem',
                  border: '1px solid var(--border-color)',
                  color: 'var(--danger-color)'
                }}
              >
                {this.state.error.toString()}
              </pre>
            )}
            <button className="btn btn-primary" onClick={this.handleReload} style={{ width: '100%' }}>
              Reload Application
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
