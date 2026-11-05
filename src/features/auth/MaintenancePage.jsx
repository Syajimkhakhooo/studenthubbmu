import React from 'react';
import { Wrench } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function MaintenancePage() {
  const { logout, profile } = useAuth();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Wrench size={32} style={{ color: '#f59e0b' }} />
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}
        >
          Sistem Sedang Dalam Pemeliharaan
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '8px',
          }}
        >
          Tim administrator LPK BMU sedang melakukan pembaruan atau penginputan data.
          Sistem akan kembali normal dalam waktu singkat.
        </p>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-tertiary)',
            marginBottom: '32px',
          }}
        >
          Silakan coba kembali beberapa saat lagi atau hubungi administrator.
        </p>

        {/* Info Box */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            marginBottom: '24px',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Login sebagai:</strong>{' '}
            {profile?.full_name || profile?.email || '—'}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Peran:</strong>{' '}
            {profile?.role || '—'}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          style={{
            padding: '10px 24px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Keluar dari Akun
        </button>
      </div>
    </div>
  );
}

