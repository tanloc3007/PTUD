import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import { logout } from '../../features/auth/api/authApi';
import '../../shared/styles/unimind-student-theme.css';

const DESKTOP_NAV = [
  { to: '/student/home',      label: 'Trang chủ' },
  { to: '/student/community', label: 'Góc chia sẻ' },
  { to: '/student/booking',   label: 'Đặt lịch tư vấn' },
  { to: '/student/journal',   label: 'Nhật ký' },
  { to: '/student/test',      label: 'Trắc nghiệm DASS-21' },
  { to: '/student/saferoom',  label: 'Phòng An Yên' },
];

const MOBILE_NAV = [
  { to: '/student/home',      label: 'Trang chủ' },
  { to: '/student/community', label: 'Chia sẻ' },
  { to: '/student/booking',   label: 'Đặt lịch' },
  { to: '/student/journal',   label: 'Nhật ký' },
  { to: '/student/test',      label: 'Trắc nghiệm' },
];

export default function StudentLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    clearAuth();
    navigate('/login');
  };

  const anonymousCode = user?.anonymousCode || user?.fullName || 'Bạn Ẩn Danh';

  return (
    <div className="student-portal">

      {/* ══════════════ TOPBAR ══════════════ */}
      <header
        className="student-topbar"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: 60,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 40px',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        {/* Brand: Clean typographic title with subtle teal dot */}
        <Link
          to="/student/home"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 18,
            fontWeight: 900,
            color: '#0f766e',
            letterSpacing: '-0.02em',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
        >
          <span>UniMind</span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0d9488' }} />
        </Link>

        {/* Desktop Nav: Clean typography text links, no icon clutter */}
        {!isMobile && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {DESKTOP_NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `student-nav-link${isActive ? ' active' : ''}`}
                style={({ isActive }) => ({
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#0f766e' : '#4b5563',
                  background: isActive ? '#f0fdfa' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  border: isActive ? '1px solid #ccfbf1' : '1px solid transparent'
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 20,
                background: '#f8fafc',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#0d9488',
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                  {anonymousCode}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '6px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: 'transparent',
                  color: '#6b7280',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Manrope', sans-serif",
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              style={{
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 14,
                fontWeight: 700,
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed',
          top: 60,
          right: 12,
          left: 12,
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          padding: '12px',
          zIndex: 100,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#0f766e', padding: '6px 10px', margin: '0 0 6px' }}>
            {anonymousCode}
          </p>
          <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0 8px' }} />
          {DESKTOP_NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={{ display: 'block', padding: '10px', color: '#1f2937', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0' }} />
          <button
            onClick={handleLogout}
            style={{ display: 'block', width: '100%', padding: '10px', color: '#dc2626', fontSize: 13.5, fontWeight: 700, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Đăng xuất
          </button>
        </div>
      )}

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <main
        className="student-page-shell"
        style={{
          paddingTop: 60,
          paddingBottom: isMobile ? 65 : 32,
          minHeight: '100vh',
        }}
      >
        <div style={{ width: '100%', maxWidth: 1360, margin: '0 auto', padding: isMobile ? '16px 12px' : '28px 32px', boxSizing: 'border-box' }}>
          <Outlet />
        </div>
      </main>

      {/* ══════════════ MOBILE BOTTOM NAV ══════════════ */}
      {isMobile && (
        <nav className="student-bottom-nav" style={{ height: 56, background: '#ffffff', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {MOBILE_NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `student-bottom-nav-btn${isActive ? ' active' : ''}`}
              style={({ isActive }) => ({
                color: isActive ? '#0f766e' : '#6b7280',
                fontWeight: isActive ? 800 : 600,
                fontSize: 12,
                textDecoration: 'none'
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

    </div>
  );
}
