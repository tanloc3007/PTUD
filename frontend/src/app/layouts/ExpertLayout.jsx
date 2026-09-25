import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import { logout } from '../../features/auth/api/authApi';
import ThemeToggle from '../../shared/components/ThemeToggle';
import '../../shared/styles/unimind-expert-theme.css';

const THEME_KEY = 'unimind-expert-theme';
const SIDEBAR_WIDTH = 250;

const NAV_ITEMS = [
  { to: '/expert/workspace',    label: 'Bàn làm việc' },
  { to: '/expert/schedule',     label: 'Lịch hẹn & Duyệt ca' },
  { to: '/expert/analytics',    label: 'Phân tích & Cảnh báo' },
  { to: '/expert/moderation',   label: 'Kiểm duyệt bài viết' },
  { to: '/expert/profile',      label: 'Hồ sơ chuyên viên' },
];

export default function ExpertLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || 'light'
  );
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebar] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.body.style.background = theme === 'dark' ? '#0f172a' : '#f8fafc';
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleLogout = async () => {
    await logout();
    clearAuth();
    navigate('/login');
  };

  const initials = (user?.fullName || 'E')[0].toUpperCase();

  return (
    <div className="expert-portal" data-theme={theme}>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--e-font)' }}>

        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <button
            onClick={() => setSidebar(false)}
            aria-label="Đóng menu"
            style={{ position: 'fixed', inset: 0, background: 'var(--e-overlay)', border: 'none', zIndex: 45, cursor: 'pointer' }}
          />
        )}

        {/* ══════════════ SIDEBAR ══════════════ */}
        <aside
          className="expert-sidebar"
          style={{
            width: SIDEBAR_WIDTH,
            height: '100vh',
            position: 'fixed',
            left: 0, top: 0,
            transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
            transition: 'transform 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 14px',
            zIndex: 50,
            overflowY: 'auto',
          }}
        >
          {/* Brand */}
          <div style={{ marginBottom: 24, paddingLeft: 8 }}>
            <h1 className="expert-brand-title" style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--e-text)' }}>
              UniMind
            </h1>
            <p className="expert-brand-subtitle" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '2px 0 0', color: 'var(--e-text-muted)' }}>
              Cổng Chuyên Viên
            </p>
          </div>

          {/* Expert info card */}
          <div style={{
            background: 'var(--e-primary-muted)',
            border: '1px solid var(--e-border)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div className="expert-avatar" style={{ borderRadius: 6 }}>{initials}</div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--e-text)', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.fullName || 'Chuyên viên'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--e-primary)', margin: 0, fontWeight: 600 }}>
                Chuyên viên Tâm lý
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `expert-nav-link${isActive ? ' active' : ''}`}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div style={{ paddingTop: 16, borderTop: '1px solid var(--e-border)' }}>
            <button
              className="expert-ghost-btn"
              onClick={handleLogout}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
            >
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* ══════════════ TOPBAR ══════════════ */}
        <header
          className="expert-topbar"
          style={{
            position: 'fixed', top: 0, right: 0,
            width: isMobile ? '100%' : `calc(100% - ${SIDEBAR_WIDTH}px)`,
            height: 60,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 16px' : '0 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button
                onClick={() => setSidebar(true)}
                aria-label="Mở menu"
                style={{ background: 'none', border: '1px solid var(--e-border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 13 }}
              >
                Menu
              </button>
            )}
            {!isMobile && (
              <span style={{ fontSize: 13, color: 'var(--e-text-muted)', fontWeight: 600 }}>
                Trạm Tham Vấn Tâm Lý — Chuyên viên
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <div className="expert-avatar" style={{ width: 34, height: 34, fontSize: 13, borderRadius: 6 }}>{initials}</div>
            {!isMobile && (
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--e-text)' }}>
                {user?.fullName || 'Chuyên viên'}
              </span>
            )}
          </div>
        </header>

        {/* ══════════════ MAIN CONTENT ══════════════ */}
        <main
          className="expert-main"
          style={{
            marginLeft: isMobile ? 0 : SIDEBAR_WIDTH,
            width: isMobile ? '100%' : `calc(100% - ${SIDEBAR_WIDTH}px)`,
            marginTop: 60,
            padding: isMobile ? '18px 14px' : '28px 32px',
            minHeight: 'calc(100vh - 60px)',
            boxSizing: 'border-box',
            flex: 1,
            transition: 'margin 0.25s ease',
          }}
        >
          <Outlet />
        </main>

      </div>
    </div>
  );
}
