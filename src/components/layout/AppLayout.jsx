import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useAuth } from '../../hooks/useAuth';
import { SupabaseConfigAlert } from '../feedback/SupabaseConfigAlert';

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { isSupabaseConfigured } = useAuth();
  const location = useLocation();

  // Dynamic page title based on path
  const getPageTitle = (path) => {
    if (path.startsWith('/students/')) return 'Profil Siswa BMU';
    if (path.startsWith('/students')) return 'Pangkalan Data Siswa';
    if (path.startsWith('/documents')) return 'Verifikasi Dokumen Siswa';
    if (path.startsWith('/journey')) return 'Status & Perjalanan Siswa';
    if (path.startsWith('/reports')) return 'Student Data Explorer & PDF';
    if (path.startsWith('/settings')) return 'Pengguna & Pengaturan';
    return 'Ringkasan Dashboard';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      <div className="hide-on-mobile" style={{ height: '100%', flexShrink: 0 }}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobile={false}
        />
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Header
          pageTitle={getPageTitle(location.pathname)}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-6)',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          {/* Top banner if Supabase credentials are missing */}
          {!isSupabaseConfigured && (
            <div style={{ marginBottom: '20px' }}>
              <SupabaseConfigAlert />
            </div>
          )}

          <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
