import { useAuthStore } from '../../../features/auth/store/authStore';

export default function StudentProfilePage() {
  const { user } = useAuthStore();
  return (
    <div className="student-page-shell">
      <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--s-text)', margin: '0 0 20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        👤 Hồ Sơ Của Tôi
      </h1>
      <div className="s-card" style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
        <div className="s-anon-avatar" style={{ width: 64, height: 64, fontSize: 24, flexShrink: 0 }}>
          {(user?.anonymousCode || user?.fullName || 'B').substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--s-text)' }}>
            {user?.anonymousCode || 'Bạn Ẩn Danh'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--s-primary)', margin: '0 0 6px', fontWeight: 600 }}>🎓 Sinh viên UniMind</p>
          <span className="s-badge s-badge-teal">✅ Tài khoản ẩn danh</span>
        </div>
      </div>
      <div className="s-card">
        <p style={{ color: 'var(--s-text-muted)', fontSize: 13 }}>
          Hồ sơ của bạn được bảo mật hoàn toàn. Tên thật và MSSV không bao giờ được hiển thị công khai.
        </p>
      </div>
    </div>
  );
}
