import React from 'react';
import { logToBackend } from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Hatayı backend veritabanına post et
    logToBackend({
      level: 'Critical',
      message: `React Render Hatası: ${error.message}`,
      stackTrace: error.stack,
      metadata: {
        componentStack: errorInfo.componentStack
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: 'var(--danger, #ee5d50)' }}>⚠️ Beklenmeyen bir hata oluştu</h2>
          <p style={{ color: 'var(--text-muted, #a3aed1)' }}>Hata detayları sistem yöneticisine iletildi.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              marginTop: '16px', 
              padding: '8px 16px', 
              background: 'var(--primary, #4361ee)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
