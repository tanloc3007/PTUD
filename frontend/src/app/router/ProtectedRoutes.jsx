import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';

/** Route Loader fallback */
export function RouteFallback() {
  return (
    <div className="route-loader">
      <div className="route-spinner" />
      <span>Đang tải trang...</span>
    </div>
  );
}

/** Protected route chung — yêu cầu đăng nhập */
export function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

/** Yêu cầu role cụ thể */
export function RequireRole({ role, children }) {
  const { user, token } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize: chấp nhận single role hoặc array
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

/** Public-only route: đã đăng nhập thì redirect về trang chính */
export function PublicOnlyRoute({ children }) {
  const { user, token } = useAuthStore();

  if (token && user) {
    const role = user.role;
    if (role === 'Admin')  return <Navigate to="/admin/dashboard" replace />;
    if (role === 'Expert') return <Navigate to="/expert/workspace" replace />;
    return <Navigate to="/student/home" replace />;
  }

  return children;
}

/** Student Protected Route */
export function StudentRoute({ children }) {
  return <RequireRole role="Student">{children}</RequireRole>;
}

/** Expert Protected Route */
export function ExpertRoute({ children }) {
  return <RequireRole role="Expert">{children}</RequireRole>;
}

/** Admin Protected Route */
export function AdminRoute({ children }) {
  return <RequireRole role="Admin">{children}</RequireRole>;
}
