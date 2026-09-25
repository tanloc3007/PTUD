import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdfa 0%, #f8f9fa 100%)',
      fontFamily: "'Manrope', sans-serif", padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 80, margin: '0 0 16px' }}>🌿</div>
        <h1 style={{ fontSize: 64, fontWeight: 900, color: '#0d9488', margin: '0 0 8px', lineHeight: 1 }}>404</h1>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
          Trang không tồn tại
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 32px', lineHeight: 1.6 }}>
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 24px', borderRadius: 12,
          background: '#0d9488', color: '#fff',
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
          boxShadow: '0 6px 20px rgba(13,148,136,0.30)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
