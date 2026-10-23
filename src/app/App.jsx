import React from 'react';
import { AppProviders } from './providers';
import { AppRouter } from './router';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';

export function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </AppProviders>
  );
}

export default App;
