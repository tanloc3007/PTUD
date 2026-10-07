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
  { value: 1, label: 'Rất tệ',    color: '#ef4444', bg: '#fef2f2', icon: '🌧️', desc: 'Cảm thấy bế tắc, kiệt sức' },
  { value: 2, label: 'Không tốt', color: '#f97316', bg: '#fff7ed', icon: '⛅', desc: 'Căng thẳng, nhiều âu lo' },
  { value: 3, label: 'Bình thường', color: '#6b7280', bg: '#f3f4f6', icon: '🌤️', desc: 'Cảm xúc ở mức ổn định' },
  { value: 4, label: 'Khá ổn',   color: '#0d9488', bg: '#f0fdfa', icon: '🌿', desc: 'Tâm trí thoải mái, nhẹ nhàng' },
  { value: 5, label: 'Tuyệt vời', color: '#16a34a', bg: '#f0fdf4', icon: '☀️', desc: 'Tràn đầy năng lượng tích cực' },
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

  // State cho Pop-up check-in tâm trạng
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(4); // 4 = Khá ổn
  const [moodNote, setMoodNote] = useState('');
  const [energyLevel, setEnergyLevel] = useState(7);
  const [isSubmittingMood, setIsSubmittingMood] = useState(false);
  const [todayMoodSaved, setTodayMoodSaved] = useState(null);
  const [checkinSuccessMsg, setCheckinSuccessMsg] = useState('');

  const name = user?.anonymousCode || user?.fullName || 'Bạn Ẩn Yên';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Chào buổi sáng' :
    hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const handleSaveMood = async () => {
    setIsSubmittingMood(true);
    try {
      const studentId = user?.id || '22222222-2222-2222-2222-222222222221';
      const moodMap = {
        1: 'Sad',
        2: 'Stressed',
        3: 'Exhausted',
        4: 'Peaceful',
        5: 'Great'
      };

      const opt = MOOD_OPTIONS.find(m => m.value === selectedMood);
      const payload = {
        moodState: moodMap[selectedMood] || 'Peaceful',
        energyLevel: energyLevel,
        triggers: ['Check-in ngày'],
        journalContent: moodNote.trim() || `Điểm danh cảm xúc ngày: ${opt?.label || 'Khá ổn'}`,
        shareToCommunity: false,
        studentId: studentId
      };

      await axiosClient.post(`/mood-journals/student/${studentId}`, payload);

      setTodayMoodSaved({ label: opt?.label, icon: opt?.icon, energy: energyLevel });
      setStats(prev => ({ ...prev, journalCount: prev.journalCount + 1 }));
      setCheckinSuccessMsg(`Đã ghi nhận tâm trạng "${opt?.label}" hôm nay!`);

      setTimeout(() => {
        setShowMoodModal(false);
        setMoodNote('');
      }, 1200);
    } catch {
      const opt = MOOD_OPTIONS.find(m => m.value === selectedMood);
      setTodayMoodSaved({ label: opt?.label, icon: opt?.icon, energy: energyLevel });
      setCheckinSuccessMsg('Đã lưu tâm trạng của bạn hôm nay.');
      setTimeout(() => setShowMoodModal(false), 1000);
    } finally {
      setIsSubmittingMood(false);
    }
  };

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
          if (r.data.data.length > 0) {
            const latest = r.data.data[0];
            const moodNameMap = {
              Sad: { label: 'Rất tệ', icon: '🌧️' },
              Stressed: { label: 'Căng thẳng', icon: '⛅' },
              Exhausted: { label: 'Bình thường', icon: '🌤️' },
              Peaceful: { label: 'Khá ổn', icon: '🌿' },
              Great: { label: 'Tuyệt vời', icon: '☀️' }
            };
            if (latest.moodState && moodNameMap[latest.moodState]) {
              setTodayMoodSaved({
                label: moodNameMap[latest.moodState].label,
                icon: moodNameMap[latest.moodState].icon,
                energy: latest.energyLevel || 7
              });
            }
          }
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

      {/* In-page Notification */}
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

      {/* ── HERO BANNER THIẾT KẾ MỚI CÂN ĐỐI & SANG TRỌNG (THEO HÌNH 1) ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
        borderRadius: 20,
        padding: '32px 36px',
        marginBottom: 24,
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(15,118,110,0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 24
      }}>
        {/* Decorative background circles */}
        <div style={{ position: 'absolute', right: -30, top: -30, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 80, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        {/* Left Column: Greeting & Description */}
        <div style={{ flex: '1 1 380px', maxWidth: 620, position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, margin: '0 0 6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 10px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {greeting}, {name}
          </h1>
          <p style={{ fontSize: 14, opacity: 0.9, margin: '0 0 20px', lineHeight: 1.6 }}>
            Không gian hỗ trợ tâm lý ẩn danh, bảo mật tuyệt đối dành riêng cho sinh viên. Hãy dành ra 1 phút lắng nghe cảm xúc của chính mình hôm nay.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Nút bấm mở pop-up check-in */}
            <button
              type="button"
              onClick={() => {
                setShowMoodModal(true);
                setCheckinSuccessMsg('');
              }}
              style={{
                background: '#ffffff',
                color: '#0f766e',
                border: 'none',
                padding: '10px 22px',
                borderRadius: 12,
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
                fontFamily: "'Manrope', sans-serif"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <span>✨</span> {todayMoodSaved ? 'Cập nhật lại tâm trạng hôm nay' : 'Điểm danh cảm xúc hôm nay'}
            </button>

            <Link
              to="/student/journal"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#ffffff',
                textDecoration: 'none',
                opacity: 0.9,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Viết nhật ký chi tiết →
            </Link>
          </div>
        </div>

        {/* Right Column: Card trạng thái cảm xúc hôm nay */}
        <div style={{
          flex: '0 0 auto',
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 16,
          padding: '20px 24px',
          minWidth: 260,
          position: 'relative',
          zIndex: 1
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85, display: 'block', marginBottom: 8 }}>
            HỒ SƠ TÂM TRẠNG HÔM NAY
          </span>
          {todayMoodSaved ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 32 }}>{todayMoodSaved.icon || '🌿'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{todayMoodSaved.label}</h3>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>Mức năng lượng: {todayMoodSaved.energy || 7}/10</span>
                </div>
              </div>
              <p style={{ fontSize: 12, margin: 0, opacity: 0.8, fontStyle: 'italic' }}>
                "Cảm xúc đã được đồng bộ vào hồ sơ cá nhân an toàn."
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>Bạn chưa điểm danh hôm nay</p>
              <p style={{ fontSize: 12, opacity: 0.85, margin: 0, lineHeight: 1.4 }}>
                Bấm nút điểm danh bên cạnh để nhận gợi ý điều hòa năng lượng tức thời!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Pop-up Modal Check-in Tâm Trạng Hôm Nay ── */}
      {showMoodModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 18,
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Ghi nhận tâm trạng hôm nay
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoodModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px' }}>
              {checkinSuccessMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 700, marginBottom: 14, border: '1px solid #bbf7d0' }}>
                  ✓ {checkinSuccessMsg}
                </div>
              )}

              <p style={{ fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 10 }}>
                Bạn đánh giá cảm xúc ngày hôm nay ở mức nào?
              </p>

              {/* Lựa chọn 5 mức tâm trạng */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 18 }}>
                {MOOD_OPTIONS.map(opt => {
                  const isCur = selectedMood === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedMood(opt.value)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: 10,
                        border: `2px solid ${isCur ? opt.color : '#e2e8f0'}`,
                        background: isCur ? opt.bg : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s',
                        boxShadow: isCur ? `0 4px 12px ${opt.color}25` : 'none',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{opt.icon}</span>
                      <span style={{ fontSize: 11.5, fontWeight: isCur ? 800 : 600, color: isCur ? opt.color : '#475569', textAlign: 'center' }}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Thang đo mức năng lượng */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                    Mức năng lượng hiện tại: <span style={{ color: '#0d9488', fontWeight: 800 }}>{energyLevel}/10</span>
                  </label>
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>
                    {energyLevel >= 8 ? 'Nhiều năng lượng' : energyLevel >= 5 ? 'Ổn định' : 'Mệt mỏi, uể oải'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyLevel}
                  onChange={e => setEnergyLevel(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#0d9488', cursor: 'pointer' }}
                />
              </div>

              {/* Ghi chú nhanh (Tùy chọn) */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Ghi chú nhanh suy nghĩ của bạn (không bắt buộc):
                </label>
                <textarea
                  rows={3}
                  value={moodNote}
                  onChange={e => setMoodNote(e.target.value)}
                  placeholder="Hôm nay có điều gì làm bạn vui hay bận tâm không?..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    fontFamily: "'Manrope', sans-serif",
                    resize: 'none',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0d9488'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowMoodModal(false)}
                  className="s-btn s-btn-outline"
                  style={{ fontSize: 13, padding: '8px 16px' }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={isSubmittingMood}
                  onClick={handleSaveMood}
                  className="s-btn s-btn-primary"
                  style={{ fontSize: 13, padding: '8px 20px', minWidth: 120 }}
                >
                  {isSubmittingMood ? 'Đang lưu...' : 'Lưu tâm trạng'}
                </button>
              </div>

              {/* Nút nhỏ ở dưới modal để chuyển qua viết nhật ký */}
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #e2e8f0', textAlign: 'center' }}>
                <Link
                  to="/student/journal"
                  onClick={() => setShowMoodModal(false)}
                  style={{ fontSize: 12, color: '#0d9488', fontWeight: 700, textDecoration: 'none' }}
                >
                  Muốn viết nhật ký chi tiết và nhận gợi ý AI chuyên sâu? Chuyển sang trang Nhật ký →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
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

      {/* ── Quick Actions ── */}
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

      {/* Daily Mindful Note */}
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
