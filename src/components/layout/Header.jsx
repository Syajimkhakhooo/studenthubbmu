import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ROLE_LABELS } from '../../utils/constants';
import { CookiePolicyModal } from '../../features/auth/CookiePolicyModal';
import { ConfirmModal } from '../feedback/ConfirmModal';
import { Menu, LogOut, Shield, Database, Info, Sun, Moon } from 'lucide-react';

export function Header({ onOpenMobileNav, pageTitle }) {
  const { profile, user, logout, isSupabaseConfigured } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);

  const roleName = profile?.role ? ROLE_LABELS[profile.role] || profile.role : 'Staf Internal';
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Pengguna';

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-4)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Mobile hamburger & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="hide-on-desktop"
          style={{
            color: 'var(--text-secondary)',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Buka Menu Navigasi"
        >
          <Menu size={20} />
        </button>

        {pageTitle && (
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {pageTitle}
          </h2>
        )}
      </div>

      {/* Right: Supabase status, User info, Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Supabase status pill */}
        <div
          title={isSupabaseConfigured ? 'Supabase Terhubung' : 'Supabase Belum Dikonfigurasi'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: isSupabaseConfigured ? 'rgba(46, 160, 67, 0.1)' : 'rgba(210, 153, 34, 0.1)',
            border: `1px solid ${isSupabaseConfigured ? 'rgba(46, 160, 67, 0.25)' : 'rgba(210, 153, 34, 0.25)'}`,
            fontSize: '0.75rem',
            color: isSupabaseConfigured ? 'var(--status-success-text)' : 'var(--status-warning-text)',
          }}
          className="hide-on-mobile"
        >
          <Database size={13} />
          <span>{isSupabaseConfigured ? 'Database Aktif' : 'Konfigurasi Diperlukan'}</span>
        </div>

        {/* Privacy & Cookie policy link */}
        <button
          type="button"
          onClick={() => setShowCookieModal(true)}
          title="Kebijakan Privasi & Sesi"
          style={{
            color: 'var(--text-tertiary)',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Info size={17} />
        </button>

        {/* Theme Toggle Button (Dark/Light) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Beralih ke Tema Terang (Putih)' : 'Beralih ke Tema Gelap (Hitam)'}
          style={{
            color: 'var(--text-secondary)',
            padding: '6px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          aria-label={isDark ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
        >
          {isDark ? (
            <Sun size={17} style={{ color: '#e3b341' }} />
          ) : (
            <Moon size={17} style={{ color: '#4f46e5' }} />
          )}
        </button>

        {/* User Role & Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.75rem',
              flexShrink: 0,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }} className="hide-on-mobile">
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2 }}>
              {displayName}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
              {roleName}
            </span>
          </div>
        </div>

        {/* Logout action button */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          title="Keluar dari Akun"
          style={{
            color: 'var(--text-secondary)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          <LogOut size={15} />
          <span className="hide-on-mobile">Keluar</span>
        </button>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin mengakhiri sesi kerja Student Hub BMU pada perangkat ini?"
        confirmText="Ya, Keluar"
        variant="danger"
      />

      <CookiePolicyModal
        isOpen={showCookieModal}
        onClose={() => setShowCookieModal(false)}
      />
    </header>
  );
}
