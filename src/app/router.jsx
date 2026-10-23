import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthGuard } from '../features/auth/AuthGuard';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { AuthCallback } from '../features/auth/AuthCallback';
import { AccessDeniedPage } from '../features/auth/AccessDeniedPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { StudentListPage } from '../features/students/StudentListPage';
import { StudentDetailPage } from '../features/students/StudentDetailPage';
import { DocumentHubPage } from '../features/documents/DocumentHubPage';
import { StudentJourneyPage } from '../features/student-journey/StudentJourneyPage';
import { ReportsExplorerPage } from '../features/reports/ReportsExplorerPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Public Landing & Auth Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Protected App Routes wrapped in AppLayout and AuthGuard */}
      <Route
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/students" element={<StudentListPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/documents" element={<DocumentHubPage />} />
        <Route path="/journey" element={<StudentJourneyPage />} />
        <Route path="/journeys" element={<Navigate to="/journey" replace />} />
        <Route path="/reports" element={<ReportsExplorerPage />} />
        <Route
          path="/settings"
          element={
            <AuthGuard allowedRoles={['admin', 'operational_manager', 'principal']}>
              <SettingsPage />
            </AuthGuard>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
