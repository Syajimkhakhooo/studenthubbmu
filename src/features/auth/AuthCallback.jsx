import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';

export function AuthCallback() {
  const { user, profile, loading, accessDenied } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (accessDenied) {
        navigate('/access-denied', { replace: true });
      } else if (user && profile) {
        navigate('/dashboard', { replace: true });
      } else if (!user) {
        navigate('/login', { replace: true });
      }
    }
  }, [loading, user, profile, accessDenied, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        gap: '16px',
      }}
    >
      <div style={{ width: '320px' }}>
        <LoadingSkeleton lines={3} />
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        Memverifikasi kredensial dan izin internal...
      </p>
    </div>
  );
}
