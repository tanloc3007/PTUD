import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/authApi';
import { useAuthStore, getDefaultPathByRole } from '../store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

const STEPS = [
  { n: 1, label: 'Thông tin sinh viên' },
  { n: 2, label: 'Mật khẩu bảo mật' },
  { n: 3, label: 'Xác nhận đăng ký' },
];

const FACULTIES = [
  'Công nghệ Thông tin',
  'Quản trị Kinh doanh',
  'Kế toán - Kiểm toán',
  'Ngoại ngữ',
  'Luật',
  'Kỹ thuật Xây dựng',
  'Cơ khí',
  'Điện - Điện tử',
  'Y Dược',
  'Khoa học Xã hội',
  'Khác',
];

const YEARS = ['Năm 1', 'Năm 2', 'Năm 3', 'Năm 4', 'Năm 5+', 'Cao học'];

export default function RegisterPage() {
  const navigate  = useNavigate();
  const { setAuth } = useAuthStore();

  const [step, setStep]     = useState(1);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    studentId:   '',
    faculty:     '',
    yearOfStudy: '',
    email:       '',
    password:    '',
    confirmPass: '',
  });

  const [showPass, setShowPass]    = useState(false);
  const [showConfirm, setShowConf] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  /* ── Validation per step ── */
  const validateStep1 = () => {
    if (!form.studentId.trim()) return 'Vui lòng nhập Mã số sinh viên (MSSV).';
    if (!form.faculty)          return 'Vui lòng chọn khoa đang theo học.';
    if (!form.yearOfStudy)      return 'Vui lòng chọn năm học hiện tại.';
    if (!form.email.includes('@')) return 'Email liên lạc không hợp lệ.';
    return '';
  };

  const validateStep2 = () => {
    if (form.password.length < 8)          return 'Mật khẩu phải có ít nhất 8 ký tự.';
    if (!/[A-Z]/.test(form.password))      return 'Mật khẩu phải chứa ít nhất 1 chữ hoa.';
    if (!/[0-9]/.test(form.password))      return 'Mật khẩu phải chứa ít nhất 1 chữ số.';
    if (form.password !== form.confirmPass) return 'Mật khẩu xác nhận không khớp.';
    return '';
  };

  const goNext = () => {
    setError('');
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : '';
    if (err) { setError(err); return; }
    setStep(s => s + 1);
  };

  const goBack = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async () => {
    if (!agreed) { setError('Bạn cần đồng ý với chính sách bảo mật để hoàn tất đăng ký.'); return; }
    setError('');
    setLoad(true);
    try {
      const data = await register({
        studentId:   form.studentId.trim(),
        emailOrMSSV: form.email.trim() || form.studentId.trim(),
        email:       form.email.trim(),
        fullName:    `Sinh viên ${form.studentId.trim()}`,
        faculty:     form.faculty,
        yearOfStudy: form.yearOfStudy,
        password:    form.password,
        role:        'Student',
      });

      const user  = data.user  || data.data?.user;
      const token = data.token || data.data?.token || data.accessToken;

      if (user && token) {
        setAuth(user, token);
        navigate(getDefaultPathByRole(user.role), { replace: true });
      } else {
        navigate('/login', { state: { registered: true } });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoad(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)       s++;
    if (/[A-Z]/.test(p))     s++;
    if (/[0-9]/.test(p))     s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthColors = ['#e5e7eb', '#ef4444', '#f97316', '#fbbf24', '#10b981'];
  const strengthLabels = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 70% 0%, rgba(13,148,136,0.12) 0%, transparent 55%),
                   linear-gradient(180deg, #f9fafb 0%, #f0fdfa 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Manrope', sans-serif",
    }}>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 500 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Tạo Tài Khoản Sinh Viên
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Hệ thống UniMind — Bảo mật danh tính và nhật ký cá nhân
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 18,
          border: '1px solid #e5e7eb',
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>

          {/* Wizard steps header */}
          <div style={{ padding: '18px 24px 14px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {STEPS.map((s, i) => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                      background: step > s.n ? '#0d9488' : step === s.n ? '#0d9488' : '#e5e7eb',
                      color: step >= s.n ? '#fff' : '#6b7280',
                      flexShrink: 0,
                    }}>
                      {step > s.n ? '✓' : s.n}
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: step === s.n ? 800 : 600, color: step === s.n ? '#0d9488' : '#6b7280', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: step > s.n ? '#0d9488' : '#e5e7eb', marginLeft: 10, marginRight: 10 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form body */}
          <div style={{ padding: '24px 28px 28px' }}>

            {/* Error banner as InPageNotification */}
            {error && (
              <InPageNotification
                type="error"
                title="Thông tin chưa hợp lệ"
                message={error}
                onClose={() => setError('')}
              />
            )}

            {/* ─── STEP 1: Thông tin cơ bản ─── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* MSSV */}
                <div>
                  <label style={labelStyle}>Mã số sinh viên (MSSV) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    style={inputStyle}
                    placeholder="Ví dụ: 120000212"
                    value={form.studentId}
                    onChange={e => set('studentId', e.target.value)}
                  />
                  <p style={hintStyle}>MSSV chỉ dùng để xác minh sinh viên, không bao giờ hiển thị công khai.</p>
                </div>

                {/* Khoa */}
                <div>
                  <label style={labelStyle}>Khoa / Ngành học <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    style={inputStyle}
                    value={form.faculty}
                    onChange={e => set('faculty', e.target.value)}
                  >
                    <option value="">-- Chọn khoa --</option>
                    {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Năm học */}
                <div>
                  <label style={labelStyle}>Năm học <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {YEARS.map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => set('yearOfStudy', y)}
                        style={{
                          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: `1.5px solid ${form.yearOfStudy === y ? '#0d9488' : '#e5e7eb'}`,
                          background: form.yearOfStudy === y ? '#f0fdfa' : '#fff',
                          color: form.yearOfStudy === y ? '#0d9488' : '#6b7280',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email liên lạc <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="email"
                    style={inputStyle}
                    placeholder="sv@lhu.edu.vn hoặc gmail..."
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                  <p style={hintStyle}>Email dùng để nhận thông báo lịch hẹn và xác thực tài khoản.</p>
                </div>
              </div>
            )}

            {/* ─── STEP 2: Bảo mật ─── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Password */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={labelStyle}>Mật khẩu <span style={{ color: '#ef4444' }}>*</span></label>
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      style={{ border: 'none', background: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                    >
                      {showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    </button>
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    style={inputStyle}
                    placeholder="Ít nhất 8 ký tự, 1 chữ hoa, 1 số"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                  />

                  {/* Strength bar */}
                  {form.password.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: strength >= i ? strengthColors[strength] : '#e5e7eb' }} />
                        ))}
                      </div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: strengthColors[strength], margin: 0 }}>
                        Độ mạnh: {strengthLabels[strength]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={labelStyle}>Xác nhận mật khẩu <span style={{ color: '#ef4444' }}>*</span></label>
                    <button
                      type="button"
                      onClick={() => setShowConf(v => !v)}
                      style={{ border: 'none', background: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                    >
                      {showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    </button>
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    style={inputStyle}
                    placeholder="Nhập lại mật khẩu"
                    value={form.confirmPass}
                    onChange={e => set('confirmPass', e.target.value)}
                  />
                  {form.confirmPass && form.confirmPass !== form.password && (
                    <p style={{ fontSize: 11.5, color: '#ef4444', fontWeight: 700, margin: '4px 0 0' }}>
                      Mật khẩu xác nhận không khớp
                    </p>
                  )}
                  {form.confirmPass && form.confirmPass === form.password && (
                    <p style={{ fontSize: 11.5, color: '#15803d', fontWeight: 700, margin: '4px 0 0' }}>
                      Mật khẩu đã khớp
                    </p>
                  )}
                </div>

                <InPageNotification
                  type="info"
                  message="Mật khẩu của bạn được mã hóa an toàn bằng thuật toán băm chuẩn công nghiệp. UniMind không lưu trữ mật khẩu gốc."
                />
              </div>
            )}

            {/* ─── STEP 3: Xác nhận ─── */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Summary card */}
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px' }}>
                  {[
                    { label: 'MSSV',      value: form.studentId },
                    { label: 'Khoa',      value: form.faculty },
                    { label: 'Năm học',   value: form.yearOfStudy },
                    { label: 'Email',     value: form.email },
                    { label: 'Mật khẩu',  value: '••••••••' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                      <span style={{ color: '#6b7280', fontWeight: 600 }}>{row.label}</span>
                      <span style={{ color: '#111827', fontWeight: 700 }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Privacy notice */}
                <InPageNotification
                  type="info"
                  title="Cam kết bảo mật danh tính"
                  message="MSSV chỉ dùng để xác thực quyền sinh viên và không bao giờ xuất hiện ở bài viết cộng đồng. Chuyên viên tư vấn chỉ thấy bí danh bảo mật của bạn."
                />

                {/* Agreement */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    style={{ marginTop: 3, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
                    Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu tâm lý sinh viên của UniMind.
                  </span>
                </label>
              </div>
            )}

            {/* ─── Navigation buttons ─── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, gap: 10 }}>
              {step > 1 ? (
                <button type="button" onClick={goBack} style={backBtnStyle}>
                  ← Quay lại
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button type="button" onClick={goNext} style={nextBtnStyle}>
                  Tiếp tục →
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={loading || !agreed} style={{ ...nextBtnStyle, opacity: loading || !agreed ? 0.5 : 1, cursor: loading || !agreed ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer link */}
        <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 18 }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: '#0d9488', fontWeight: 800, textDecoration: 'none' }}>
            Đăng nhập ngay →
          </Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12.5, fontWeight: 700,
  color: '#374151', marginBottom: 6,
};

const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e5e7eb', outline: 'none', borderRadius: 8,
  fontSize: 13.5, fontFamily: "'Manrope', sans-serif",
  color: '#111827', background: '#fff',
  boxSizing: 'border-box',
};

const hintStyle = {
  fontSize: 11.5, color: '#6b7280', margin: '5px 0 0',
  fontWeight: 600,
};

const nextBtnStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '10px 22px', borderRadius: 8,
  background: '#0d9488',
  color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 800,
  cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
  transition: 'opacity 0.15s ease',
};

const backBtnStyle = {
  display: 'inline-flex', alignItems: 'center',
  padding: '10px 16px', borderRadius: 8,
  border: '1px solid #e5e7eb', background: '#fff',
  color: '#6b7280', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
};
