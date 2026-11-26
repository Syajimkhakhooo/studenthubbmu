import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  Route,
  Filter,
  Settings,
  ShieldAlert,
} from 'lucide-react';

export function Sidebar({ isCollapsed, onToggleCollapse, isMobile, onCloseMobile }) {
  const { profile, isAdmin, isPrincipal, isViewer } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/students', label: 'Data Siswa', icon: Users },
  ];

  // Dokumen Siswa only visible to internal staff/admins, hidden for viewers
  if (!isViewer) {
    navItems.push({ to: '/documents', label: 'Dokumen Siswa', icon: FileCheck2 });
  }

  navItems.push(
    { to: '/journey', label: 'Perjalanan Siswa', icon: Route },
    { to: '/reports', label: 'Filter & Laporan', icon: Filter }
  );

  // Only admin and principal/manager have access to User & Settings menu
  if (isAdmin || isPrincipal) {
    navItems.push({ to: '/settings', label: 'Pengguna & Pengaturan', icon: Settings });
  }

  const handleNavClick = () => {
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      style={{
        width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'width var(--transition-normal)',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {/* Brand Header — Klik Logo untuk Ciutkan / Perluas Sidebar */}
      <div
        onClick={!isMobile ? onToggleCollapse : undefined}
        title={!isMobile ? (isCollapsed ? 'Klik logo untuk perluas menu' : 'Klik logo untuk ciutkan menu') : undefined}
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          padding: isCollapsed ? '0' : '0 var(--space-4)',
          borderBottom: '1px solid var(--border-subtle)',
          cursor: !isMobile ? 'pointer' : 'default',
          userSelect: 'none',
          transition: 'background-color var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          if (!isMobile) e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
        }}
        onMouseLeave={(e) => {
          if (!isMobile) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/logo.png"
            alt="Logo LPK BMU"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              objectFit: 'contain',
              flexShrink: 0,
              transition: 'transform var(--transition-fast)',
            }}
          />
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.2 }}>
                Student Hub
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                LPK Bahtera Mitra Unggulan
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          flex: 1,
          padding: 'var(--space-3) var(--space-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          overflowY: 'auto',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              title={isCollapsed ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                transition: 'all var(--transition-fast)',
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!isCollapsed && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>LPK Bahtera Mitra Unggulan</div>
          <div>v1.0.0 — Production Ready</div>
        </div>
      )}
    </aside>
  );
}
