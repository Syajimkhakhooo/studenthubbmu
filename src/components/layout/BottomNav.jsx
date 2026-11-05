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
    { to: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
    { to: '/students', label: 'Siswa', icon: Users },
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
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 90,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '56px',
          maxWidth: '560px',
          margin: '0 auto',
          padding: '0 2px',
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
                gap: '2px',
                padding: '6px 2px',
                textDecoration: 'none',
                color: isActive ? 'var(--color-primary-500, #4f46e5)' : 'var(--text-tertiary)',
                transition: 'all var(--transition-fast)',
                position: 'relative',
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        width: '24px',
                        height: '3px',
                        borderRadius: '0 0 3px 3px',
                        backgroundColor: 'var(--color-primary-500, #4f46e5)',
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px 10px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isActive ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: isActive ? 600 : 500,
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
