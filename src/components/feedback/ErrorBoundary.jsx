import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-danger-subtle, rgba(239, 68, 68, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: 'var(--color-danger, #ef4444)',
            }}
          >
            <AlertTriangle size={32} />
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Terjadi Kendala Memuat Halaman
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              maxWidth: '480px',
              marginBottom: '24px',
              lineHeight: 1.5,
            }}
          >
            Aplikasi mengalami kendala tak terduga saat memproses tampilan ini. Anda dapat menyegarkan halaman atau kembali ke Dashboard.
          </p>

          {this.state.error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-surface-elevated, #f3f4f6)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: 'var(--text-tertiary, #6b7280)',
                maxWidth: '560px',
                overflowX: 'auto',
                marginBottom: '24px',
                textAlign: 'left',
                border: '1px solid var(--border-subtle, #e5e7eb)',
              }}
            >
              {this.state.error.toString()}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="secondary"
              icon={Home}
              onClick={() => {
                window.location.href = '/dashboard';
              }}
            >
              Ke Dashboard
            </Button>
            <Button
              variant="primary"
              icon={RefreshCw}
              onClick={this.handleReset}
            >
              Muat Ulang Halaman
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
