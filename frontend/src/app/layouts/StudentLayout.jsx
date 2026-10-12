import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import axiosClient, { logout } from '../../features/auth/api/authApi';
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
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);

  // Active meeting detection (Chỉ hiển thị cho sinh viên đã đặt lịch với chuyên viên)
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [dismissedMeetingId, setDismissedMeetingId] = useState(null);

  useEffect(() => {
    const studentId = user?.id || '22222222-2222-2222-2222-222222222221';
    if (!studentId) return;

    const checkActiveMeeting = () => {
      axiosClient.get(`/appointments/student/${studentId}/active-meeting`)
        .then(res => {
          if (res.data?.data?.hasActiveMeeting) {
            setActiveMeeting(res.data.data);
          } else {
            setActiveMeeting(null);
          }
        })
        .catch(() => {});
    };

    checkActiveMeeting();
    const timer = setInterval(checkActiveMeeting, 4000);
    return () => clearInterval(timer);
  }, [user?.id]);

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
  const isInMeetingRoom = location.pathname.includes(`/student/meeting/${activeMeeting?.appointmentId}`);

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
        {/* Brand: Custom Lotus Logo & typographic title */}
        <Link
          to="/student/home"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 18,
            fontWeight: 900,
            color: '#0f766e',
            letterSpacing: '-0.02em',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
        >
          <img src="/logo.svg" alt="UniMind Logo" style={{ width: 32, height: 32, borderRadius: 9 }} />
          <span>UniMind</span>
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
          {activeMeeting && !isInMeetingRoom && (
            <button
              onClick={() => navigate(`/student/meeting/${activeMeeting.appointmentId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: isMobile ? '5px 8px' : '6px 14px',
                borderRadius: 20,
                background: '#ecfdf5',
                border: '1.5px solid #10b981',
                color: '#065f46',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              <span>{isMobile ? 'Vào phòng' : `🔴 Vào phòng (${activeMeeting.expertName})`}</span>
            </button>
          )}

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

      {/* ══════════════ FLOATING NOTIFICATION: CUỘC HỌP ĐANG MỞ (CHỈ DÀNH RIÊNG CHO SINH VIÊN ĐÃ ĐẶT LỊCH) ══════════════ */}
      {activeMeeting && !isInMeetingRoom && dismissedMeetingId !== activeMeeting.appointmentId && (
        <div style={{
          position: 'fixed',
          top: 72,
          right: isMobile ? 12 : 24,
          width: 380,
          maxWidth: 'calc(100vw - 24px)',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          borderRadius: 16,
          boxShadow: '0 20px 45px -10px rgba(15, 118, 110, 0.3), 0 0 0 1.5px rgba(13, 148, 136, 0.3)',
          padding: '16px 18px',
          zIndex: 9999,
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 900,
                color: '#047857',
                background: '#d1fae5',
                padding: '2px 8px',
                borderRadius: 12,
                letterSpacing: '0.04em'
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                CUỘC HỌP ĐANG MỞ
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b' }}>
                #{activeMeeting.bookingCode}
              </span>
            </div>
            <button
              onClick={() => setDismissedMeetingId(activeMeeting.appointmentId)}
              title="Thu nhỏ thông báo"
              style={{
                background: 'none',
                border: 'none',
                fontSize: 16,
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>

          <h3 style={{ fontSize: 14.5, fontWeight: 900, color: '#0f172a', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Chuyên viên {activeMeeting.expertName} đang đợi bạn!
          </h3>
          <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 14px', lineHeight: 1.5 }}>
            Chuyên viên đã mở phòng tư vấn trực tuyến cho ca hẹn của bạn. Bạn không cần nhập mã mời, hãy tham gia ngay.
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate(`/student/meeting/${activeMeeting.appointmentId}`)}
              style={{
                flex: 1,
                padding: '9px 14px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🎥</span> Tham gia ngay
            </button>
            <button
              onClick={() => setDismissedMeetingId(activeMeeting.appointmentId)}
              style={{
                padding: '9px 12px',
                background: '#f1f5f9',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Tạm ẩn
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
