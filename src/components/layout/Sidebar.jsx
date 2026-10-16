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
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export function Sidebar({ isCollapsed, onToggleCollapse, isMobile, onCloseMobile }) {
  const { profile, isAdmin, isPrincipal } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/students', label: 'Data Siswa', icon: Users },
    { to: '/documents', label: 'Dokumen Siswa', icon: FileCheck2 },
    { to: '/journey', label: 'Perjalanan Siswa', icon: Route },
    { to: '/reports', label: 'Filter & Laporan', icon: Filter },
  ];

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
      {/* Brand Header */}
      <div
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0' : '0 var(--space-4)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              flexShrink: 0,
            }}
          >
            BMU
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.2 }}>
                Student Hub
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                LPK Mitra Unggulan
              </div>
            </div>
          )}
        </div>

        {!isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
            style={{
              color: 'var(--text-tertiary)',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: isCollapsed ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
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

      {/* Collapse Toggle for collapsed state */}
      {!isMobile && isCollapsed && (
        <div style={{ padding: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Perluas Sidebar"
            style={{
              color: 'var(--text-tertiary)',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

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
