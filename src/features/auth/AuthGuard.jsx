import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';

export function AuthGuard({ children, allowedRoles }) {
  const { user, profile, loading, accessDenied } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        <div style={{ width: '320px' }}>
          <LoadingSkeleton lines={3} />
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return <Navigate to="/access-denied" replace />;
  }

  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--status-danger-text)' }}>Akses Terbatas</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Peran Anda ({profile.role}) tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  return children;
}
