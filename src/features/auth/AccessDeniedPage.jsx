import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, LogOut, Mail, HelpCircle } from 'lucide-react';

export function AccessDeniedPage() {
  const { deniedEmail, user, logout } = useAuth();
  const currentEmail = deniedEmail || user?.email || 'Akun Anda';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            border: '1px solid var(--status-danger-border)',
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
          Akses Internal Dibatasi
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
          Akun Google berikut berhasil diverifikasi, namun <strong>belum terdaftar</strong> dalam daftar pengguna internal yang diizinkan LPK Bahtera Mitra Unggulan:
        </p>

        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
            color: 'var(--text-primary)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Mail size={14} style={{ color: 'var(--text-tertiary)' }} />
          <span>{currentEmail}</span>
        </div>

        <div
          style={{
            textAlign: 'left',
            padding: '14px',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
            display: 'flex',
            gap: '10px',
          }}
        >
          <HelpCircle size={18} style={{ flexShrink: 0, color: 'var(--text-tertiary)', marginTop: '2px' }} />
          <div>
            <strong>Apa yang harus dilakukan?</strong>
            <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
              Silakan hubungi Administrator Sistem BMU untuk menambahkan alamat email di atas ke dalam <code>internal_allowlist</code> database.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          style={{ width: '100%' }}
          icon={LogOut}
          onClick={logout}
        >
          Keluar &amp; Gunakan Akun Lain
        </Button>
      </div>
    </div>
  );
}
