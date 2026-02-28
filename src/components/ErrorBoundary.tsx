import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: '#0a0f1a',
          color: '#e2e8f0'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</p>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Error al cargar la aplicación</p>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '0.5rem',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
