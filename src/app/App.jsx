import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { UIProvider } from '../shared/context/UIContext';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import { logToBackend } from '../shared/utils/logger';

function App() {
  useEffect(() => {
    // Global JavaScript hataları
    const handleGlobalError = (event) => {
      logToBackend({
        level: 'Critical',
        message: `Global Hata: ${event.message}`,
        stackTrace: event.error?.stack || '',
        metadata: { filename: event.filename, lineno: event.lineno }
      });
    };

    // Yakalanmamış Promise (async/await) hataları
    const handleUnhandledRejection = (event) => {
      logToBackend({
        level: 'Error',
        message: `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
        stackTrace: event.reason?.stack || '',
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <UIProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </UIProvider>
    </ErrorBoundary>
  );
}

export default App;
