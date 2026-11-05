import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { settingsService } from '../../services/settingsService';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { MaintenancePage } from './MaintenancePage';

export function AuthGuard({ children, allowedRoles }) {
  const { user, profile, loading, accessDenied } = useAuth();
  const location = useLocation();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceChecked, setMaintenanceChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkMaintenance() {
      try {
        const isOn = await settingsService.getMaintenanceMode();
        if (!cancelled) {
          setMaintenanceMode(isOn);
        }
      } catch {
        // If check fails (e.g. table not yet created), treat as not in maintenance
        if (!cancelled) setMaintenanceMode(false);
      } finally {
        if (!cancelled) setMaintenanceChecked(true);
      }
    }

    if (user) {
      checkMaintenance();
    } else {
      setMaintenanceChecked(true);
    }

    return () => { cancelled = true; };
  }, [user]);

  if (loading || !maintenanceChecked) {
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

  // Only redirect to login if there is no authenticated user
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Maintenance mode check: block all non-admins
  if (maintenanceMode && profile?.role !== 'admin') {
    return <MaintenancePage />;
  }

  if (allowedRoles && allowedRoles.length > 0 && profile?.role && !allowedRoles.includes(profile.role)) {
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
