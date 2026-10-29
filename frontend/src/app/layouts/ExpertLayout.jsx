import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import { logout, getMyProfile } from '../../features/auth/api/authApi';
import ThemeToggle from '../../shared/components/ThemeToggle';
import NotificationBell from '../../features/notifications/components/NotificationBell';
import '../../shared/styles/unimind-expert-theme.css';

const THEME_KEY = 'unimind-expert-theme';
const SIDEBAR_WIDTH = 250;

const ALL_NAV_ITEMS = [
  { to: '/expert/workspace',    label: 'Bàn làm việc',          permission: 'PERM_WORKSPACE' },
  { to: '/expert/schedule',     label: 'Lịch hẹn & Duyệt ca',    permission: 'PERM_SCHEDULE' },
  { to: '/expert/analytics',    label: 'Phân tích & Cảnh báo',   permission: 'PERM_ANALYTICS' },
  { to: '/expert/moderation',   label: 'Kiểm duyệt bài viết',    permission: 'PERM_MODERATION' },
  { to: '/expert/profile',      label: 'Hồ sơ chuyên viên',      permission: null },
];

export default function ExpertLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || 'light'
  );
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebar] = useState(false);

  // Phân quyền chi tiết cho chuyên viên (Mặc định đầy đủ quyền nếu chưa từng cấu hình)
  const userPerms = Array.isArray(user?.permissions)
    ? user.permissions
    : ['PERM_WORKSPACE', 'PERM_SCHEDULE', 'PERM_ANALYTICS', 'PERM_MODERATION'];

  const navItems = ALL_NAV_ITEMS.filter(item => !item.permission || userPerms.includes(item.permission));

  const currentNavItem = ALL_NAV_ITEMS.find(item => item.to === location.pathname);
  const isUnauthorized = currentNavItem?.permission && !userPerms.includes(currentNavItem.permission);

  // Tự động làm mới trang khi Quản trị viên cập nhật phân quyền
  useEffect(() => {
    if (!user?.id) return;

    const handleApplyNewPerms = (newPerms) => {
      const currentList = Array.isArray(user?.permissions)
        ? user.permissions
        : ['PERM_WORKSPACE', 'PERM_SCHEDULE', 'PERM_ANALYTICS', 'PERM_MODERATION'];
      const currentKey = currentList.slice().sort().join(',');
      const nextKey = (newPerms || []).slice().sort().join(',');

      if (currentKey !== nextKey) {
        // Cập nhật auth store và localStorage
        useAuthStore.getState().updateUser({ permissions: newPerms });
        // Tải lại trang ngay lập tức để áp dụng quyền mới
        window.location.reload();
      }
    };

    // 1. Nhận sự kiện liên tab qua storage event (cùng trình duyệt)
    const onStorage = (e) => {
      if (e.key === 'unimind_expert_perm_updated' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload.userId === user.id) {
            handleApplyNewPerms(payload.permissions);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);

    // 2. Nhận sự kiện tức thời qua BroadcastChannel
    let bc = null;
    try {
      bc = new BroadcastChannel('unimind_perm_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'PERMISSIONS_UPDATED' && event.data.userId === user.id) {
          handleApplyNewPerms(event.data.permissions);
        }
      };
    } catch {}

    // 3. Heartbeat polling định kỳ (mỗi 2.5 giây) gọi /api/auth/me để phát hiện ngay cả khi mở trên trình duyệt khác/tab ẩn danh
    const timer = setInterval(async () => {
      try {
        const res = await getMyProfile();
        if (res?.success && res.data && res.data.permissions !== undefined) {
          handleApplyNewPerms(res.data.permissions || []);
        }
      } catch {}
    }, 2500);

    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
      clearInterval(timer);
    };
  }, [user?.id, user?.permissions]);

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
          <div style={{ marginBottom: 24, paddingLeft: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.svg" alt="UniMind Logo" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
            <div>
              <h1 className="expert-brand-title" style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--e-text)' }}>
                UniMind
              </h1>
              <p className="expert-brand-subtitle" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '2px 0 0', color: 'var(--e-text-muted)' }}>
                Cổng Chuyên Viên
              </p>
            </div>
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
                {userPerms.length < 4 ? `Được cấp ${userPerms.length}/4 quyền` : 'Chuyên viên Tâm lý'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map(item => (
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
            <NotificationBell role="Expert" theme={theme} />
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
          {isUnauthorized ? (
            <div style={{
              maxWidth: 580,
              margin: '60px auto',
              textAlign: 'center',
              background: 'var(--e-card)',
              padding: '40px 32px',
              borderRadius: 16,
              border: '1px solid #fecdd3',
              boxShadow: '0 10px 25px -5px rgba(225, 29, 72, 0.08)'
            }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🛡️</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e11d48', margin: '0 0 10px' }}>
                Quyền truy cập bị giới hạn
              </h2>
              <p style={{ fontSize: 14, color: 'var(--e-text-muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
                Tài khoản của bạn chưa được Quản trị viên cấp quyền truy cập mục <strong>"{currentNavItem?.label}"</strong>.
                Hệ thống tuân thủ phân quyền chức năng tối thiểu theo chuẩn Playbook. Vui lòng liên hệ Admin để được cấp quyền.
              </p>
              <button
                onClick={() => navigate(navItems[0]?.to || '/expert/profile')}
                className="expert-primary-btn"
                style={{ padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
              >
                ← Quay lại trang được phép ({navItems[0]?.label || 'Hồ sơ'})
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

      </div>
    </div>
  );
}
