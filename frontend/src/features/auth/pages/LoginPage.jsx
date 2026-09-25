import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore, getDefaultPathByRole } from '../store/authStore';
import { login } from '../api/authApi';
import InPageNotification from '../../../shared/components/InPageNotification';

const TABS = [
  { key: 'Student', label: 'Sinh viên',   color: '#0d9488', bg: '#f0fdfa' },
  { key: 'Expert',  label: 'Chuyên viên', color: '#0369a1', bg: '#f0f9ff' },
  { key: 'Admin',   label: 'Quản trị viên', color: '#4338ca', bg: '#f5f3ff' },
];

const DEMOS = {
  Student: { email: 'student@unimind.edu.vn', password: 'Student@123' },
  Expert:  { email: 'expert@unimind.edu.vn',  password: 'Expert@123' },
  Admin:   { email: 'admin@unimind.edu.vn',   password: 'Admin@123' },
};

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('Student');
  const [form, setForm]           = useState({ email: '', password: '' });
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();
  const location    = useLocation();
  const from        = location.state?.from?.pathname;

  const activeColor = TABS.find(t => t.key === activeTab)?.color || '#0d9488';
  const activeBg    = TABS.find(t => t.key === activeTab)?.bg    || '#f0fdfa';

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const fillDemo = () => {
    const d = DEMOS[activeTab];
    setForm({ email: d.email, password: d.password });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await login({ 
        emailOrMSSV: form.email,
        email: form.email, 
        password: form.password,
        role: activeTab 
      });

      const user  = data.user  || data.data?.user;
      const token = data.token || data.data?.token || data.accessToken;

      if (!user || !token) throw new Error('Phản hồi đăng nhập không hợp lệ.');

      setAuth(user, token);
      const dest = from || getDefaultPathByRole(user.role);
      navigate(dest, { replace: true });
    } catch (err) {
      const resData = err.response?.data;
      let msg = resData?.message || resData?.Message;
      
      if (!msg && resData?.errors && typeof resData.errors === 'object') {
        const errorList = Object.values(resData.errors).flat();
        if (errorList.length > 0) msg = errorList.join(' ');
      }
      
      if (!msg) {
        if (err.response?.status === 400 || err.response?.status === 401) {
          msg = 'Mật khẩu hoặc thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại.';
        } else if (err.response?.status === 404) {
          msg = 'Tài khoản không tồn tại trong hệ thống. Vui lòng kiểm tra lại email hoặc MSSV.';
        } else if (err.code === 'ERR_NETWORK') {
          msg = 'Không thể kết nối đến máy chủ Backend (http://localhost:5080). Vui lòng đảm bảo Backend đang chạy.';
        } else {
          msg = err.message || 'Đăng nhập thất bại. Kiểm tra thông tin và thử lại.';
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 60% 0%, ${activeColor}15 0%, transparent 55%),
                   linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      transition: 'background 0.4s ease',
      fontFamily: "'Manrope', sans-serif",
    }}>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            UniMind
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Hệ thống Nhật Ký Cảm Xúc &amp; Tư Vấn Tâm Lý Học Đường
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setError(''); }}
                  style={{
                    flex: 1, padding: '14px 8px',
                    border: 'none',
                    background: isActive ? tab.bg : 'transparent',
                    color: isActive ? tab.color : '#6b7280',
                    fontSize: 13,
                    fontWeight: isActive ? 800 : 600,
                    cursor: 'pointer',
                    borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                    transition: 'all 0.15s ease',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px' }}>

            {/* In-Page Notification for error */}
            {error && (
              <InPageNotification
                type="error"
                title="Đăng nhập không thành công"
                message={error}
                onClose={() => setError('')}
              />
            )}

            {/* Quick demo */}
            <button
              type="button"
              onClick={fillDemo}
              style={{
                width: '100%', padding: '9px 14px',
                background: `${activeColor}0d`,
                border: `1px dashed ${activeColor}80`,
                borderRadius: 8, marginBottom: 18,
                color: activeColor, fontSize: 12.5, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
                textAlign: 'center',
              }}
            >
              Tự động điền tài khoản mẫu ({TABS.find(t=>t.key===activeTab)?.label})
            </button>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Email đăng nhập hoặc MSSV
              </label>
              <input
                type="text" name="email" value={form.email}
                onChange={handleChange}
                placeholder={`${activeTab.toLowerCase()}@unimind.edu.vn`}
                required autoComplete="username"
                style={{
                  display: 'block', width: '100%', padding: '10px 14px',
                  border: '1.5px solid #e5e7eb', borderRadius: 8,
                  fontSize: 13.5, fontFamily: "'Manrope', sans-serif",
                  color: '#111827', background: '#fff',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = activeColor}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ border: 'none', background: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  {showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                </button>
              </div>
              <input
                type={showPass ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu của bạn"
                required autoComplete="current-password"
                style={{
                  display: 'block', width: '100%', padding: '10px 14px',
                  border: '1.5px solid #e5e7eb', borderRadius: 8,
                  fontSize: 13.5, fontFamily: "'Manrope', sans-serif",
                  color: '#111827', background: '#fff',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = activeColor}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px',
                background: loading ? '#9ca3af' : activeColor,
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Manrope', sans-serif",
                transition: 'opacity 0.15s ease',
              }}
            >
              {loading ? 'Đang xử lý đăng nhập...' : `Đăng nhập (${TABS.find(t=>t.key===activeTab)?.label})`}
            </button>

            {/* Role notices */}
            {activeTab === 'Student' && (
              <div style={{
                marginTop: 18,
                padding: '10px 14px',
                background: '#f0fdfa',
                borderRadius: 8,
                border: '1px solid #ccfbf1',
                textAlign: 'center',
                fontSize: 12.5,
                color: '#0f766e',
              }}>
                <span>Chưa có tài khoản sinh viên? </span>
                <Link to="/register" style={{ fontWeight: 800, color: '#0d9488', textDecoration: 'none' }}>
                  Đăng ký ngay →
                </Link>
              </div>
            )}

            {activeTab === 'Expert' && (
              <div style={{
                marginTop: 18,
                padding: '10px 14px',
                background: '#f0f9ff',
                borderRadius: 8,
                border: '1px solid #e0f2fe',
                fontSize: 12,
                color: '#0369a1',
                lineHeight: 1.5,
                textAlign: 'center'
              }}>
                Tài khoản Chuyên viên do Quản trị viên (Admin) thẩm định và cấp quyền. Vui lòng liên hệ Admin nếu bạn chưa có tài khoản.
              </div>
            )}

            {activeTab === 'Admin' && (
              <div style={{
                marginTop: 18,
                padding: '10px 14px',
                background: '#f5f3ff',
                borderRadius: 8,
                border: '1px solid #ede9fe',
                fontSize: 12,
                color: '#4338ca',
                lineHeight: 1.5,
                textAlign: 'center'
              }}>
                Tài khoản Quản trị viên được phân quyền bảo mật trực tiếp từ CSDL hệ thống.
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 18 }}>
          Bảo mật thông tin • Hoàn toàn ẩn danh • Chuẩn an toàn dữ liệu
        </p>
      </div>
    </div>
  );
}
