import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore';
import axiosClient from '../../auth/api/authApi';
import InPageNotification from '../../../shared/components/InPageNotification';

const QUICK_ACTIONS = [
  { to: '/student/community', tag: 'Cộng đồng', label: 'Góc chia sẻ ẩn danh', desc: 'Chia sẻ tâm sự và lắng nghe bạn bè cùng trường trong môi trường an toàn.', accent: '#0d9488' },
  { to: '/student/booking',   tag: 'Tham vấn 1-1', label: 'Đặt lịch tư vấn', desc: 'Kết nối trực tiếp cùng chuyên viên tâm lý học đường hoàn toàn riêng tư.', accent: '#0369a1' },
  { to: '/student/journal',   tag: 'Nhật ký cá nhân', label: 'Nhật ký cảm xúc', desc: 'Ghi lại cảm xúc mỗi ngày, nhận phản hồi và gợi ý điều hòa từ AI.', accent: '#7c3aed' },
  { to: '/student/test',      tag: 'Đánh giá tâm lý', label: 'Trắc nghiệm DASS-21', desc: 'Thang đo chuẩn hóa đánh giá mức độ trầm cảm, lo âu và căng thẳng.', accent: '#b45309' },
  { to: '/student/saferoom',  tag: 'Thư giãn', label: 'Phòng An Yên', desc: 'Thực hành hít thở sâu 4-7-8 giúp phục hồi năng lượng tức thì.', accent: '#065f46' },
];

const MOOD_OPTIONS = [
  { value: 1, label: 'Rất tệ',    color: '#ef4444', bg: '#fef2f2' },
  { value: 2, label: 'Không tốt', color: '#f97316', bg: '#fff7ed' },
  { value: 3, label: 'Bình thường', color: '#6b7280', bg: '#f3f4f6' },
  { value: 4, label: 'Khá ổn',   color: '#0d9488', bg: '#f0fdfa' },
  { value: 5, label: 'Tuyệt vời', color: '#16a34a', bg: '#f0fdf4' },
];

export default function StudentHomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    journalCount: 0,
    postsCount: 0,
    testsCount: 0
  });
  const [dismissNotification, setDismissNotification] = useState(false);

  const name = user?.anonymousCode || user?.fullName || 'Bạn Ẩn Yên';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Chào buổi sáng' :
    hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  useEffect(() => {
    const studentId = user?.id;

    // Load appointments count
    const apptUrl = studentId ? `/appointments/student/${studentId}` : '/appointments/my';
    axiosClient.get(apptUrl)
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data)) {
          const upcoming = r.data.data.filter(a => a.status === 'Confirmed' || a.status === 'Pending').length;
          setStats(prev => ({ ...prev, upcomingAppointments: upcoming }));
        }
      })
      .catch(() => {});

    // Load journals count
    const journalUrl = studentId ? `/mood-journals/student/${studentId}` : '/mood-journals/my';
    axiosClient.get(journalUrl)
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data)) {
          setStats(prev => ({ ...prev, journalCount: r.data.data.length }));
        }
      })
      .catch(() => {});

    // Load posts count
    axiosClient.get('/community/posts')
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data)) {
          const myPosts = r.data.data.filter(p => p.anonymousPseudonym === user?.anonymousCode || p.studentId === studentId);
          setStats(prev => ({ ...prev, postsCount: myPosts.length > 0 ? myPosts.length : r.data.data.length }));
        }
      })
      .catch(() => {});

    // Load test status
    const testUrl = studentId ? `/psychological-tests/student/${studentId}/latest` : '/psychological-tests/latest';
    axiosClient.get(testUrl)
      .then(r => {
        if (r.data?.data) {
          setStats(prev => ({ ...prev, testsCount: 1 }));
        }
      })
      .catch(() => {});
  }, [user?.id, user?.anonymousCode]);

  return (
    <div className="student-page-shell">

      {/* ── In-page Notification Banner ── */}
      {!dismissNotification && stats.upcomingAppointments > 0 && (
        <InPageNotification
          type="info"
          title="Lịch tư vấn sắp tới"
          message={`Bạn đang có ${stats.upcomingAppointments} cuộc hẹn tư vấn với chuyên viên tâm lý. Vui lòng kiểm tra thời gian và địa điểm phòng tham vấn.`}
          action={{
            label: 'Xem lịch của tôi',
            onClick: () => navigate('/student/booking')
          }}
          onClose={() => setDismissNotification(true)}
        />
      )}

      {/* ── Hero Greeting ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
        borderRadius: 16,
        padding: '32px 36px',
        marginBottom: 24,
        color: '#ffffff',
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.85, margin: '0 0 6px', letterSpacing: '0.04em' }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 8px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {greeting}, {name}
          </h1>
          <p style={{ fontSize: 14, opacity: 0.9, margin: '0 0 22px', maxWidth: 640, lineHeight: 1.5 }}>
            Không gian hỗ trợ tâm lý ẩn danh, an toàn và riêng tư dành cho sinh viên. Hôm nay bạn cảm thấy thế nào?
          </p>

          {/* Quick mood check-in (Clean text pills, no emoji spam) */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => navigate('/student/journal')}
                style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: "'Manrope', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
                  e.currentTarget.style.borderColor = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Minimalist Stats Row (Typography-driven, no icon circles) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Lịch hẹn sắp tới', value: stats.upcomingAppointments, desc: 'Ca tham vấn đang chờ' },
          { label: 'Nhật ký cảm xúc', value: stats.journalCount, desc: 'Bản ghi tâm trạng' },
          { label: 'Bài viết cộng đồng', value: stats.postsCount, desc: 'Lượt tương tác thấu cảm' },
          { label: 'Trắc nghiệm DASS-21', value: stats.testsCount > 0 ? 'Đã hoàn thành' : 'Chưa thực hiện', desc: 'Hồ sơ sức khỏe tinh thần' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 14,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: typeof stat.value === 'number' ? 28 : 16, fontWeight: 900, color: '#111827', margin: '0 0 4px', lineHeight: 1.2 }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              {stat.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions (Clean Cards, no loud icons) ── */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>
          Dịch vụ &amp; Tiện ích
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                padding: '22px',
                textDecoration: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = action.accent;
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: action.accent,
                    marginBottom: 8,
                  }}
                >
                  {action.tag}
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                  {action.label}
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                  {action.desc}
                </p>
              </div>

              <div style={{ marginTop: 18, fontSize: 12.5, fontWeight: 700, color: action.accent }}>
                Truy cập ngay →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Daily Mindful Note (Clean Minimalist Banner) ── */}
      <section style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '18px 22px',
      }}>
        <p style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f766e', margin: '0 0 6px' }}>
          Gợi ý chăm sóc bản thân
        </p>
        <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, margin: 0 }}>
          Hít thở chậm và sâu trong 2 phút giúp ổn định nhịp tim và giảm áp lực bài vở. Bạn có thể sử dụng bài tập hít thở tại <Link to="/student/saferoom" style={{ color: '#0f766e', fontWeight: 700 }}>Phòng An Yên</Link> bất cứ lúc nào.
        </p>
      </section>

    </div>
  );
}
