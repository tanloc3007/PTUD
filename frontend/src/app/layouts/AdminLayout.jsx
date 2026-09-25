import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import { logout } from '../../features/auth/api/authApi';
import ThemeToggle from '../../shared/components/ThemeToggle';
import '../../shared/styles/unimind-admin-theme.css';

const THEME_KEY    = 'unimind-admin-theme';
const SIDEBAR_WIDTH = 250;

const NAV_ITEMS = [
  { to: '/admin/dashboard',  label: 'Dashboard tổng quan' },
  { to: '/admin/users',      label: 'Quản lý người dùng' },
  { to: '/admin/moderation', label: 'Kiểm duyệt nội dung' },
  { to: '/admin/keywords',   label: 'Bộ lọc từ khóa' },
  { to: '/admin/tests',      label: 'Quản lý bài trắc nghiệm' },
  { to: '/admin/reports',    label: 'Báo cáo & Thống kê' },
  { to: '/admin/audit-logs', label: 'Nhật ký hệ thống' },
];

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || 'light'
  );
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebar] = useState(false);

  // Theo dõi resize
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Apply theme
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.body.style.background = theme === 'dark' ? '#0f0f1a' : '#f8f8fc';
  }, [theme]);

  const handleLogout = async () => {
    await logout();
    clearAuth();
    navigate('/login');
  };

  const initials = (user?.fullName || 'A')[0].toUpperCase();
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <div className="admin-portal" data-theme={theme}>
      <div className="admin-shell">

        {/* ── Overlay mobile ── */}
        {isMobile && sidebarOpen && (
          <button
            className="admin-sidebar-overlay"
            onClick={() => setSidebar(false)}
            aria-label="Đóng menu"
            style={{ position: 'fixed', inset: 0, border: 'none', zIndex: 45, cursor: 'pointer' }}
          />
        )}

        {/* ══════════════ SIDEBAR ══════════════ */}
        <aside
          className="admin-sidebar"
          style={{
            width: SIDEBAR_WIDTH,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            transform: isMobile
              ? sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
              : 'translateX(0)',
            transition: 'transform 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            padding: '28px 16px',
            zIndex: 50,
            overflowY: 'auto',
          }}
        >
          {/* Brand */}
          <div style={{ marginBottom: 28, paddingLeft: 8 }}>
            <h1 className="admin-brand-title"
                style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
              UniMind
            </h1>
            <p className="admin-brand-subtitle"
               style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3, marginBottom: 0 }}>
              Admin Portal
            </p>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div style={{ paddingTop: 16, borderTop: '1px solid var(--a-border)' }}>
            <button
              className="admin-ghost-btn"
              onClick={handleLogout}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
            >
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* ══════════════ TOPBAR ══════════════ */}
        <header
          className="admin-topbar"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: isMobile ? '100%' : `calc(100% - ${SIDEBAR_WIDTH}px)`,
            height: 64,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 16px' : '0 32px',
          }}
        >
          {/* Left: mobile hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {isMobile && (
              <button
                onClick={() => setSidebar(true)}
                aria-label="Mở menu"
                style={{ background: 'none', border: '1px solid var(--a-border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 13 }}
              >
                Menu
              </button>
            )}
            {!isMobile && (
              <span style={{ fontSize: 13, color: 'var(--a-text-muted)', fontWeight: 600 }}>
                Trung tâm Quản trị UniMind
              </span>
            )}
          </div>

          {/* Right: controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                className="admin-avatar"
                style={{ width: 34, height: 34, fontSize: 13, fontWeight: 800, borderRadius: 6 }}
              >
                {initials}
              </div>
              {!isMobile && (
                <div style={{ lineHeight: 1.2 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, margin: 0, color: 'var(--a-text)' }}>
                    {user?.fullName || 'Quản trị viên'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--a-text-muted)', margin: 0 }}>
                    {user?.email || 'admin@unimind.edu.vn'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ══════════════ MAIN CONTENT ══════════════ */}
        <main
          className="admin-main"
          style={{
            marginLeft: isMobile ? 0 : SIDEBAR_WIDTH,
            width: isMobile ? '100%' : `calc(100% - ${SIDEBAR_WIDTH}px)`,
            marginTop: 64,
            padding: isMobile ? '20px 16px' : '28px 32px',
            minHeight: 'calc(100vh - 64px)',
            boxSizing: 'border-box',
            transition: 'margin 0.25s ease',
          }}
        >
          <Outlet />
        </main>

      </div>
    </div>
  );
}
