import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, getDefaultPathByRole } from '../../features/auth/store/authStore';

export default function ForbiddenPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const dest = getDefaultPathByRole(user?.role);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
      fontFamily: "'Manrope', sans-serif", padding: 24,
    }}>
      <div style={{
        maxWidth: 480, width: '100%',
        background: '#fff', borderRadius: 24,
        boxShadow: '0 20px 60px rgba(220,38,38,0.10)',
        padding: '48px 40px', textAlign: 'center',
        border: '1px solid #fecaca',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          border: '2px solid #fecaca',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#dc2626', fontVariationSettings: "'FILL' 1" }}>
            block
          </span>
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: '#dc2626', margin: '0 0 8px', lineHeight: 1 }}>403</h1>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
          Truy cập bị từ chối
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 32px', lineHeight: 1.6 }}>
          Tài khoản của bạn không có quyền truy cập vào trang này.
          Mỗi vai trò chỉ được phép xem phân hệ tương ứng.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)} style={{
            padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb',
            background: '#fff', color: '#374151', fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
          }}>
            ← Quay lại
          </button>
          <Link to={dest} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: '#0d9488', color: '#fff', fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>home</span>
            Về trang của tôi
          </Link>
        </div>
      </div>
    </div>
  );
}
