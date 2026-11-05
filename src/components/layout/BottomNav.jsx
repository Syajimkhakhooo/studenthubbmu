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
} from 'lucide-react';

export function BottomNav() {
  const { isAdmin, isPrincipal, isViewer } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/students', label: 'Data Siswa', icon: Users },
  ];

  // Dokumen Siswa only visible to non-viewer
  if (!isViewer) {
    navItems.push({ to: '/documents', label: 'Dokumen', icon: FileCheck2 });
  }

  navItems.push(
    { to: '/journey', label: 'Perjalanan', icon: Route },
    { to: '/reports', label: 'Laporan', icon: Filter }
  );

  // Pengaturan for Admin & Principal
  if (isAdmin || isPrincipal) {
    navItems.push({ to: '/settings', label: 'Pengaturan', icon: Settings });
  }

  return (
    <nav
      className="hide-on-desktop"
      aria-label="Navigasi Menu Mobile"
      style={{
        flexShrink: 0,
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 90,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
          maxWidth: '560px',
          margin: '0 auto',
          padding: '4px 6px',
          gap: '4px',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '6px 2px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                fontWeight: isActive ? 600 : 500,
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    style={{
                      flexShrink: 0,
                      transition: 'transform 200ms ease',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      lineHeight: 1.1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                    }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
