import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RouteFallback, PublicOnlyRoute, AdminRoute, ExpertRoute, StudentRoute } from './ProtectedRoutes';
import AdminLayout   from '../layouts/AdminLayout';
import ExpertLayout  from '../layouts/ExpertLayout';
import StudentLayout from '../layouts/StudentLayout';
import { useAuthStore, getDefaultPathByRole } from '../../features/auth/store/authStore';

// ── Lazy imports ─────────────────────────────────────────────
const LoginPage    = lazy(() => import('../../features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage'));

// Shared
const ForbiddenPage = lazy(() => import('../../shared/components/ForbiddenPage'));
const NotFoundPage  = lazy(() => import('../../shared/components/NotFoundPage'));

// Student Pages
const StudentHomePage      = lazy(() => import('../../features/student/pages/HomePage'));
const CommunityFeedPage    = lazy(() => import('../../features/student/pages/CommunityFeedPage'));
const StudentBookingPage   = lazy(() => import('../../features/student/pages/BookingPage'));
const JournalPage          = lazy(() => import('../../features/student/pages/JournalPage'));
const TestPage             = lazy(() => import('../../features/student/pages/TestPage'));
const SafeRoomPage         = lazy(() => import('../../features/student/pages/SafeRoomPage'));
const StudentProfilePage   = lazy(() => import('../../features/student/pages/ProfilePage'));

// Expert Pages
const ExpertWorkspacePage  = lazy(() => import('../../features/expert/pages/WorkspacePage'));
const ExpertSchedulePage   = lazy(() => import('../../features/expert/pages/SchedulePage'));
const ExpertAnalyticsPage  = lazy(() => import('../../features/expert/pages/AnalyticsPage'));
const ExpertModerationPage = lazy(() => import('../../features/expert/pages/ModerationPage'));
const ExpertProfilePage    = lazy(() => import('../../features/expert/pages/ProfilePage'));
const ExpertConsultationPage = lazy(() => import('../../features/expert/pages/ConsultationRoomPage'));

// Admin Pages
const AdminDashboardPage   = lazy(() => import('../../features/admin/pages/DashboardPage'));
const AdminUsersPage       = lazy(() => import('../../features/admin/pages/UsersPage'));
const AdminModerationPage  = lazy(() => import('../../features/admin/pages/ModerationPage'));
const AdminKeywordsPage    = lazy(() => import('../../features/admin/pages/SensitiveKeywordsPage'));
const AdminTestsPage       = lazy(() => import('../../features/admin/pages/TestManagementPage'));
const AdminReportsPage     = lazy(() => import('../../features/admin/pages/ReportsPage'));
const AdminAuditPage       = lazy(() => import('../../features/admin/pages/AuditLogsPage'));

function wrap(node) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

/** Root index redirect theo role */
function RootRedirect() {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultPathByRole(user.role)} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>

      {/* ── Root ── */}
      <Route path="/" element={<RootRedirect />} />

      {/* ── Public ── */}
      <Route path="/login" element={
        <PublicOnlyRoute>{wrap(<LoginPage />)}</PublicOnlyRoute>
      } />
      <Route path="/register" element={
        <PublicOnlyRoute>{wrap(<RegisterPage />)}</PublicOnlyRoute>
      } />
      <Route path="/403" element={wrap(<ForbiddenPage />)} />
      <Route path="*"    element={wrap(<NotFoundPage />)} />

      {/* ══════════════ STUDENT ══════════════ */}
      <Route path="/student" element={
        <StudentRoute><StudentLayout /></StudentRoute>
      }>
        <Route index element={<Navigate to="/student/home" replace />} />
        <Route path="home"      element={wrap(<StudentHomePage />)} />
        <Route path="community" element={wrap(<CommunityFeedPage />)} />
        <Route path="booking"   element={wrap(<StudentBookingPage />)} />
        <Route path="journal"   element={wrap(<JournalPage />)} />
        <Route path="test"      element={wrap(<TestPage />)} />
        <Route path="saferoom"  element={wrap(<SafeRoomPage />)} />
        <Route path="profile"   element={wrap(<StudentProfilePage />)} />
      </Route>

      {/* ══════════════ EXPERT ══════════════ */}
      <Route path="/expert" element={
        <ExpertRoute><ExpertLayout /></ExpertRoute>
      }>
        <Route index element={<Navigate to="/expert/workspace" replace />} />
        <Route path="workspace"  element={wrap(<ExpertWorkspacePage />)} />
        <Route path="schedule"   element={wrap(<ExpertSchedulePage />)} />
        <Route path="analytics"  element={wrap(<ExpertAnalyticsPage />)} />
        <Route path="moderation" element={wrap(<ExpertModerationPage />)} />
        <Route path="profile"    element={wrap(<ExpertProfilePage />)} />
        <Route path="consultation" element={wrap(<ExpertConsultationPage />)} />
      </Route>

      {/* ══════════════ ADMIN ══════════════ */}
      <Route path="/admin" element={
        <AdminRoute><AdminLayout /></AdminRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard"  element={wrap(<AdminDashboardPage />)} />
        <Route path="users"      element={wrap(<AdminUsersPage />)} />
        <Route path="moderation" element={wrap(<AdminModerationPage />)} />
        <Route path="keywords"   element={wrap(<AdminKeywordsPage />)} />
        <Route path="tests"      element={wrap(<AdminTestsPage />)} />
        <Route path="reports"    element={wrap(<AdminReportsPage />)} />
        <Route path="audit-logs" element={wrap(<AdminAuditPage />)} />
      </Route>

    </Routes>
  );
}
