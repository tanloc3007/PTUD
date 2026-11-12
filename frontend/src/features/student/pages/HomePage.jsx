import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';
import './StudentHomePage.css';

const MOOD_OPTIONS = {
  1: { label: 'Rất tệ', color: '#ef4444', bg: '#fef2f2', icon: '🌧️' },
  2: { label: 'Không tốt', color: '#f97316', bg: '#fff7ed', icon: '⛅' },
  3: { label: 'Bình thường', color: '#6b7280', bg: '#f3f4f6', icon: '🌤️' },
  4: { label: 'Khá ổn', color: '#0d9488', bg: '#f0fdfa', icon: '🌿' },
  5: { label: 'Tuyệt vời', color: '#16a34a', bg: '#f0fdf4', icon: '☀️' },
};

const MOOD_TO_API_STATE = {
  1: 'Sad',
  2: 'Stressed',
  3: 'Exhausted',
  4: 'Peaceful',
  5: 'Great',
};

const API_STATE_TO_MOOD = {
  sad: 1,
  depressed: 1,
  bad: 2,
  stressed: 2,
  anxious: 2,
  exhausted: 3,
  normal: 3,
  neutral: 3,
  peaceful: 4,
  calm: 4,
  good: 4,
  great: 5,
  happy: 5,
};

function parseImageUrls(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((u) => String(u).trim()).filter(Boolean);
  }
  const str = String(raw).trim();
  if (!str) return [];
  if (str.startsWith('[')) {
    try {
      const arr = JSON.parse(str);
      if (Array.isArray(arr)) {
        return arr.map((u) => String(u).trim()).filter(Boolean);
      }
    } catch {
      // Fallback to comma-separated parsing below
    }
  }
  return str
    .split(',')
    .map((u) => u.trim())
    .filter((u) => u && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/') || u.startsWith('data:')));
}

function getLocalYmd(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function computeStreakDays(journals) {
  if (!Array.isArray(journals) || journals.length === 0) return 0;
  const uniqueDays = new Set(journals.map((j) => getLocalYmd(j.createdAt)).filter(Boolean));
  if (uniqueDays.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!uniqueDays.has(getLocalYmd(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (uniqueDays.has(getLocalYmd(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatVietnameseDateHeader(dateObj = new Date()) {
  const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const dayName = weekdays[dateObj.getDay()];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  return `${dayName}, ${day} tháng ${month}, ${year}`.toUpperCase();
}

function formatAppointmentBadge(dateStr) {
  if (!dateStr) return { day: '--', month: 'TH--' };
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    return {
      day: parts[2].padStart(2, '0'),
      month: `Th${parseInt(parts[1], 10)}`,
    };
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { day: '--', month: 'TH--' };
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: `Th${d.getMonth() + 1}`,
  };
}

function formatShortDateVN(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('vi-VN');
}

function formatPostTime(dateInput) {
  if (!dateInput) return 'Gần đây';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return 'Gần đây';
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function resolveMoodNumber(entry) {
  if (!entry) return null;
  if (typeof entry.mood === 'number' && MOOD_OPTIONS[entry.mood]) return entry.mood;
  const key = String(entry.moodState || '').trim().toLowerCase();
  return API_STATE_TO_MOOD[key] || 4;
}

export default function HomePage() {
  const { user } = useAuthStore();
  const outletContext = useOutletContext() || {};
  const activeMeeting = outletContext.activeMeeting || null;

  const [stats, setStats] = useState({
    journalCount: 0,
    streakDays: 0,
    postCount: 0,
    testScore: null,
    testLevel: null,
    appointmentCount: 0,
  });

  const [todayMoodSaved, setTodayMoodSaved] = useState(null);
  const [latestPost, setLatestPost] = useState(null);
  const [likedLatestPost, setLikedLatestPost] = useState(false);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const [dismissNotification, setDismissNotification] = useState(false);
  const [checkinSuccessMsg, setCheckinSuccessMsg] = useState(null);

  // Mood check-in modal states
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(4);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [moodNote, setMoodNote] = useState('');
  const [savingMood, setSavingMood] = useState(false);
  const [modalError, setModalError] = useState('');

  const name = user?.anonymousCode || user?.fullName || 'Bạn Ẩn Yên';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  useEffect(() => {
    let ignore = false;
    const studentId = user?.id;

    const loadDashboardData = async () => {
      setLoadingData(true);
      const apptsUrl = studentId ? `/appointments/student/${studentId}` : '/appointments/my';
      const journalsUrl = studentId ? `/mood-journals/student/${studentId}` : '/mood-journals/my';
      const testUrl = studentId
        ? `/psychological-tests/student/${studentId}/latest`
        : '/psychological-tests/latest';

      const [apptsRes, journalsRes, postsRes, testRes] = await Promise.allSettled([
        axiosClient.get(apptsUrl),
        axiosClient.get(journalsUrl),
        axiosClient.get('/community/posts'),
        axiosClient.get(testUrl),
      ]);

      if (ignore) return;

      let nextAppt = null;
      let appointmentCount = 0;
      if (apptsRes.status === 'fulfilled') {
        const rawAppts = apptsRes.value?.data?.data;
        const appts = Array.isArray(rawAppts) ? rawAppts : [];
        const todayYmd = getLocalYmd();
        const activeAppts = appts.filter(
          (a) => a.status === 'Confirmed' || a.status === 'Pending'
        );
        appointmentCount = activeAppts.length;
        const upcoming = activeAppts
          .filter((a) => !a.date || a.date >= todayYmd)
          .sort((a, b) => {
            const cmpDate = String(a.date || '').localeCompare(String(b.date || ''));
            if (cmpDate !== 0) return cmpDate;
            return String(a.startTime || '').localeCompare(String(b.startTime || ''));
          });
        nextAppt = upcoming[0] || activeAppts[0] || null;
      }

      let journalCount = 0;
      let streakDays = 0;
      let savedToday = null;
      if (journalsRes.status === 'fulfilled') {
        const rawJournals = journalsRes.value?.data?.data;
        const journals = Array.isArray(rawJournals) ? rawJournals : [];
        journalCount = journals.length;
        streakDays = computeStreakDays(journals);

        const todayYmd = getLocalYmd();
        const sortedToday = journals
          .filter((j) => getLocalYmd(j.createdAt) === todayYmd)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (sortedToday[0]) {
          const moodNum = resolveMoodNumber(sortedToday[0]);
          savedToday = {
            mood: moodNum,
            energy: sortedToday[0].energyLevel ?? 7,
            note: sortedToday[0].journalContent || '',
          };
          setSelectedMood(moodNum);
          setEnergyLevel(sortedToday[0].energyLevel ?? 7);
        }
      }

      let visiblePostCount = 0;
      let newestPost = null;
      if (postsRes.status === 'fulfilled') {
        const rawPosts = postsRes.value?.data?.data;
        const posts = Array.isArray(rawPosts) ? rawPosts : [];
        const visiblePosts = posts
          .filter((p) => !p.isSensitiveHiddenFromStudents && p.moderationStatus !== 'Rejected')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        visiblePostCount = visiblePosts.length;
        newestPost = visiblePosts[0] || null;
      }

      let testScore = null;
      let testLevel = null;
      if (testRes.status === 'fulfilled') {
        const testData = testRes.value?.data?.data;
        if (testData) {
          testScore = testData.totalScore ?? testData.score ?? testData.percentageScore ?? null;
          testLevel = testData.severityLevel || testData.riskLevel || testData.evaluation || null;
        }
      }

      setNextAppointment(nextAppt);
      setTodayMoodSaved(savedToday);
      setLatestPost(newestPost);
      setStats({
        journalCount,
        streakDays,
        postCount: visiblePostCount,
        testScore,
        testLevel,
        appointmentCount,
      });
      setLoadingData(false);
    };

    loadDashboardData();
    return () => {
      ignore = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!showMoodModal) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !savingMood) {
        setShowMoodModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showMoodModal, savingMood]);

  const handleSaveMood = async (e) => {
    e?.preventDefault();
    setModalError('');
    setSavingMood(true);

    const studentId = user?.id || '22222222-2222-2222-2222-222222222221';
    const moodState = MOOD_TO_API_STATE[selectedMood] || 'Peaceful';
    const journalContent =
      moodNote.trim() ||
      `Check-in cảm xúc: ${MOOD_OPTIONS[selectedMood]?.label || 'Khá ổn'} (Năng lượng ${energyLevel}/10)`;

    try {
      await axiosClient.post(`/mood-journals/student/${studentId}`, {
        moodState,
        energyLevel,
        triggers: ['Check-in ngày'],
        journalContent,
        shareToCommunity: false,
        studentId,
      });

      const wasSavedToday = Boolean(todayMoodSaved);
      setTodayMoodSaved({
        mood: selectedMood,
        energy: energyLevel,
        note: moodNote.trim(),
      });
      setStats((prev) => ({
        ...prev,
        journalCount: prev.journalCount + 1,
        streakDays: prev.streakDays > 0 ? prev.streakDays : 1,
      }));
      setCheckinSuccessMsg({
        type: 'success',
        title: wasSavedToday
          ? 'Đã cập nhật tâm trạng hôm nay'
          : 'Check-in cảm xúc thành công!',
        message: `Tâm trạng "${MOOD_OPTIONS[selectedMood]?.label}" với mức năng lượng ${energyLevel}/10 đã được lưu an toàn.`,
      });
      setMoodNote('');
      setShowMoodModal(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        'Không thể lưu tâm trạng lúc này. Vui lòng thử lại sau.';
      setModalError(msg);
    } finally {
      setSavingMood(false);
    }
  };

  const handleReactLatestPost = async () => {
    if (!latestPost?.id) return;
    const prevLiked = likedLatestPost;
    const prevHugCount = latestPost.hugCount || 0;
    const optimisticDelta = prevLiked ? -1 : 1;

    setLikedLatestPost(!prevLiked);
    setLatestPost((prev) =>
      prev ? { ...prev, hugCount: Math.max(0, (prev.hugCount || 0) + optimisticDelta) } : prev
    );

    try {
      const res = await axiosClient.post(`/community/posts/${latestPost.id}/react`, {
        reactionType: 'hug',
      });
      const updated = res?.data?.data;
      if (updated && typeof updated.hugCount === 'number') {
        setLatestPost((prev) =>
          prev
            ? {
                ...prev,
                hugCount: updated.hugCount,
                empathyCount:
                  typeof updated.empathyCount === 'number'
                    ? updated.empathyCount
                    : prev.empathyCount,
              }
            : prev
        );
      }
    } catch {
      setLikedLatestPost(prevLiked);
      setLatestPost((prev) => (prev ? { ...prev, hugCount: prevHugCount } : prev));
    }
  };

  const todayMoodInfo = todayMoodSaved ? MOOD_OPTIONS[todayMoodSaved.mood] : null;
  const postImages =
    latestPost && latestPost.imageModerationStatus !== 'Rejected'
      ? parseImageUrls(latestPost.imageUrl)
      : [];
  const apptBadge = formatAppointmentBadge(nextAppointment?.date);
  const totalReactions = latestPost
    ? (latestPost.hugCount || 0) + (latestPost.empathyCount || 0)
    : 0;

  return (
    <div className="app">
      {/* MAIN */}
      <div className="main-content">
        {/* PAGE CONTAINER */}
        <div className="page-container">
          {checkinSuccessMsg && (
            <InPageNotification
              type={checkinSuccessMsg.type}
              title={checkinSuccessMsg.title}
              message={checkinSuccessMsg.message}
              onClose={() => setCheckinSuccessMsg(null)}
              style={{ marginBottom: '20px' }}
            />
          )}

          {/* NOTICE BAR */}
          {!dismissNotification && (
            <div className="notice-bar">
              <div className="notice-content">
                <span className="notice-tag">
                  {nextAppointment ? 'LỊCH HẸN SẮP TỚI' : todayMoodSaved ? 'ĐÃ GHI NHẬN' : 'NHẮC NHỞ'}
                </span>
                <span>
                  {nextAppointment
                    ? `Bạn có lịch ${nextAppointment.consultationType || 'tư vấn tâm lý'} với ${nextAppointment.expertName || 'chuyên viên'} lúc ${nextAppointment.startTime} ngày ${formatShortDateVN(nextAppointment.date)}.`
                    : todayMoodSaved
                      ? `Hôm nay bạn đã ghi nhận tâm trạng "${todayMoodInfo?.label}" với mức năng lượng ${todayMoodSaved.energy}/10.`
                      : 'Hôm nay bạn chưa điểm danh cảm xúc. Hãy dành 30 giây lắng nghe bản thân nhé!'}
                </span>
              </div>

              <div className="notice-actions">
                {nextAppointment ? (
                  <Link
                    to={
                      activeMeeting && activeMeeting.appointmentId === nextAppointment.id
                        ? `/student/meeting/${activeMeeting.appointmentId}`
                        : '/student/booking'
                    }
                    className="notice-button"
                  >
                    {activeMeeting && activeMeeting.appointmentId === nextAppointment.id
                      ? 'Vào phòng ngay'
                      : 'Xem chi tiết'}
                  </Link>
                ) : !todayMoodSaved ? (
                  <button
                    type="button"
                    className="notice-button"
                    onClick={() => setShowMoodModal(true)}
                  >
                    Check-in ngay
                  </button>
                ) : (
                  <Link to="/student/journal" className="notice-button">
                    Xem nhật ký
                  </Link>
                )}

                <button
                  type="button"
                  className="notice-close"
                  onClick={() => setDismissNotification(true)}
                  aria-label="Đóng thông báo"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* HERO SECTION */}
          <section className="hero">
            <div className="hero-content">
              <span className="hero-date">{formatVietnameseDateHeader()}</span>
              <span className="hero-eyebrow">Không gian an toàn &amp; bảo mật</span>
              <h1>
                {greeting},
                <br />
                {name}!
              </h1>
              <p>
                Hôm nay bạn thấy thế nào? Hãy dành chút thời gian lắng nghe cảm xúc của mình,
                viết vài dòng nhật ký hoặc kết nối cùng chuyên viên nhé.
              </p>

              <div className="hero-actions">
                <button
                  type="button"
                  className="hero-primary"
                  onClick={() => setShowMoodModal(true)}
                >
                  {todayMoodSaved ? 'Cập nhật lại tâm trạng' : 'Điểm danh cảm xúc hôm nay'}
                </button>
                <Link to="/student/journal" className="hero-secondary">
                  Viết nhật ký mới
                </Link>
              </div>
            </div>

            <div className="hero-image">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=85"
                alt="Sinh viên trong không gian học tập bình yên"
              />
              <div className="hero-image-overlay" />

              <div
                className="mood-floating-card"
                onClick={() => setShowMoodModal(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowMoodModal(true);
                  }
                }}
                style={{ cursor: 'pointer' }}
                title="Nhấn để điểm danh hoặc cập nhật tâm trạng hôm nay"
              >
                <span className="card-overline">TÂM TRẠNG HÔM NAY</span>
                <div className="mood-main">
                  <div>
                    <strong>{todayMoodInfo ? todayMoodInfo.label : 'Chưa ghi nhận'}</strong>
                    <small>
                      {todayMoodSaved
                        ? `Năng lượng ${todayMoodSaved.energy}/10`
                        : 'Nhấn để điểm danh ngay'}
                    </small>
                  </div>
                  <div className="weather-icon">
                    {todayMoodInfo ? todayMoodInfo.icon : '🌤️'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STATS GRID */}
          <section className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">NHẬT KÝ CẢM XÚC</span>
              <strong className="stat-number">{stats.journalCount}</strong>
              <span className="stat-description">
                {stats.streakDays > 0
                  ? `Chuỗi ${stats.streakDays} ngày duy trì liên tiếp`
                  : 'Bắt đầu ghi chép cảm xúc mỗi ngày'}
              </span>
              <div className="stat-decoration mint" />
            </div>

            <div className="stat-card">
              <span className="stat-label">LỊCH HẸN TƯ VẤN</span>
              <strong className="stat-number">{stats.appointmentCount}</strong>
              <span className="stat-description">
                {nextAppointment
                  ? `Gần nhất: ${formatShortDateVN(nextAppointment.date)} lúc ${nextAppointment.startTime}`
                  : 'Chưa có lịch hẹn nào sắp diễn ra'}
              </span>
              <div className="stat-decoration purple" />
            </div>

            <div className="stat-card">
              <span className="stat-label">TRẮC NGHIỆM WHO-5</span>
              {stats.testScore != null ? (
                <strong className="stat-number">
                  {stats.testScore}
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#64767d', marginLeft: '4px' }}>
                    /100
                  </span>
                </strong>
              ) : (
                <strong className="stat-completed">Chưa làm</strong>
              )}
              <span className="stat-description">
                {stats.testLevel
                  ? `Mức độ gần nhất: ${stats.testLevel}`
                  : 'Đánh giá nhanh sức khỏe tinh thần tuần này'}
              </span>
              <div className="stat-decoration orange" />
            </div>

            <div className="stat-card">
              <span className="stat-label">BÀI VIẾT CỘNG ĐỒNG</span>
              <strong className="stat-number">{stats.postCount}</strong>
              <span className="stat-description">Chia sẻ ẩn danh đang nhận đồng cảm</span>
              <div className="stat-decoration blue" />
            </div>
          </section>

          {/* SERVICES SECTION */}
          <section className="services-section">
            <div className="section-heading">
              <div>
                <span className="section-overline">KHÁM PHÁ KHÔNG GIAN</span>
                <h2>Dịch vụ chăm sóc tinh thần</h2>
              </div>
              <p>Chọn một hoạt động phù hợp với cảm xúc của bạn ngay lúc này.</p>
            </div>

            <div className="services-grid">
              <Link to="/student/community" className="service-card community-card">
                <div className="service-image">
                  <img
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=85"
                    alt="Góc chia sẻ ẩn danh"
                  />
                  <span className="service-number">01</span>
                </div>
                <div className="service-content">
                  <span className="service-category teal">CỘNG ĐỒNG</span>
                  <h3>Góc chia sẻ</h3>
                  <p>Tâm sự ẩn danh an toàn cùng bạn bè đồng trang lứa.</p>
                  <span className="service-link">Khám phá ngay →</span>
                </div>
              </Link>

              <Link to="/student/booking" className="service-card counseling-card">
                <div className="service-image">
                  <img
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=85"
                    alt="Đặt lịch tư vấn"
                  />
                  <span className="service-number">02</span>
                </div>
                <div className="service-content">
                  <span className="service-category blue">CHUYÊN GIA</span>
                  <h3>Đặt lịch tư vấn</h3>
                  <p>Kết nối 1-1 bảo mật với chuyên viên tham vấn tâm lý.</p>
                  <span className="service-link">Đặt lịch hẹn →</span>
                </div>
              </Link>

              <Link to="/student/journal" className="service-card journal-card">
                <div className="service-image">
                  <img
                    src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=85"
                    alt="Nhật ký cảm xúc"
                  />
                  <span className="service-number">03</span>
                </div>
                <div className="service-content">
                  <span className="service-category purple">NHẬT KÝ LIWC</span>
                  <h3>Nhật ký cảm xúc</h3>
                  <p>Ghi lại suy nghĩ mỗi ngày và nhận phân tích tâm lý nhẹ nhàng.</p>
                  <span className="service-link">Viết nhật ký →</span>
                </div>
              </Link>

              <Link to="/student/test" className="service-card test-card">
                <div className="service-image">
                  <img
                    src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=85"
                    alt="Trắc nghiệm WHO-5"
                  />
                  <span className="service-number">04</span>
                </div>
                <div className="service-content">
                  <span className="service-category orange">SÀNG LỌC</span>
                  <h3>Trắc nghiệm WHO-5</h3>
                  <p>Kiểm tra chỉ số hạnh phúc và mức độ căng thẳng cá nhân.</p>
                  <span className="service-link">Thực hiện ngay →</span>
                </div>
              </Link>

              <Link to="/student/saferoom" className="service-card safe-card">
                <div className="service-image">
                  <img
                    src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=85"
                    alt="Phòng An Yên"
                  />
                  <span className="service-number">05</span>
                </div>
                <div className="service-content">
                  <span className="service-category green">THƯ GIÃN</span>
                  <h3>Phòng An Yên</h3>
                  <p>Hít thở sâu, âm thanh chữa lành và ghi chú biết ơn mỗi ngày.</p>
                  <span className="service-link">Vào phòng →</span>
                </div>
              </Link>
            </div>
          </section>

          {/* BOTTOM TWO-COLUMN GRID */}
          <section className="bottom-grid">
            {/* COMMUNITY POST PANEL */}
            <div className="community-panel">
              <div className="panel-heading">
                <div>
                  <span>CỘNG ĐỒNG ẨN DANH</span>
                  <h3>Chia sẻ mới nhất</h3>
                </div>
                <Link to="/student/community">Xem thêm →</Link>
              </div>

              {loadingData ? (
                <div className="empty-panel-box">Đang tải bài chia sẻ từ cộng đồng...</div>
              ) : latestPost ? (
                <article className="community-post">
                  <div className="post-author">
                    <div className="anonymous-avatar">
                      {(latestPost.anonymousPseudonym || 'Ẩ').trim()[0]?.toUpperCase() || 'Ẩ'}
                    </div>
                    <div>
                      <strong>{latestPost.anonymousPseudonym || 'Bạn Ẩn Yên'}</strong>
                      <small>{formatPostTime(latestPost.createdAt)}</small>
                    </div>
                    <span className="anonymous-tag">
                      #{String(latestPost.categoryTag || 'Tâm sự').replace(/^#/, '')}
                    </span>
                  </div>

                  <p className="post-excerpt">{latestPost.content}</p>

                  {postImages.length > 0 && (
                    <div className="post-image-wrap">
                      <img
                        src={postImages[0]}
                        alt="Hình ảnh bài chia sẻ"
                        className="post-image"
                        onError={(e) => {
                          e.currentTarget.parentElement.style.display = 'none';
                        }}
                      />
                      {postImages.length > 1 && (
                        <span className="post-image-count">+{postImages.length - 1} ảnh</span>
                      )}
                    </div>
                  )}

                  <div className="post-footer">
                    <button
                      type="button"
                      className={`post-like-btn${likedLatestPost ? ' liked' : ''}`}
                      onClick={handleReactLatestPost}
                    >
                      <span>{likedLatestPost ? '♥' : '♡'}</span>
                      <span>{totalReactions} đồng cảm</span>
                    </button>

                    <Link to="/student/community">
                      💬 {latestPost.commentCount || 0} bình luận →
                    </Link>
                  </div>
                </article>
              ) : (
                <div className="empty-panel-box">
                  Chưa có bài chia sẻ nào. Hãy là người đầu tiên gửi thông điệp tích cực tại{' '}
                  <Link to="/student/community" style={{ color: '#1f545c', fontWeight: 700 }}>
                    Góc chia sẻ
                  </Link>
                  .
                </div>
              )}
            </div>

            {/* UPCOMING APPOINTMENT PANEL */}
            <div className="appointment-panel">
              <div className="panel-heading">
                <div>
                  <span>LỊCH HẸN CỦA BẠN</span>
                  <h3>Tư vấn sắp tới</h3>
                </div>
                <Link to="/student/booking">Xem tất cả →</Link>
              </div>

              {loadingData ? (
                <div className="empty-panel-box">Đang kiểm tra lịch hẹn tư vấn...</div>
              ) : nextAppointment ? (
                <>
                  <div className="appointment-card">
                    <div className="appointment-date">
                      <strong>{apptBadge.day}</strong>
                      <span>{apptBadge.month}</span>
                    </div>

                    <div className="appointment-info">
                      <h4>{nextAppointment.consultationType || 'Tư vấn tâm lý cá nhân'}</h4>
                      <p>
                        {nextAppointment.startTime} – {nextAppointment.endTime} •{' '}
                        {nextAppointment.bookingCode || 'UniMind'}
                      </p>
                    </div>

                    <span
                      className={`appointment-status${
                        nextAppointment.status === 'Pending' ? ' pending' : ''
                      }`}
                    >
                      {nextAppointment.status === 'Confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                    </span>
                  </div>

                  <div className="specialist">
                    <img
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=240&q=85"
                      alt={nextAppointment.expertName || 'Chuyên viên tư vấn'}
                      width={46}
                      height={46}
                    />
                    <div>
                      <strong>{nextAppointment.expertName || 'Chuyên viên Tâm lý UniMind'}</strong>
                      <small>{nextAppointment.expertTitle || 'Chuyên viên tham vấn tâm lý'}</small>
                    </div>
                  </div>

                  <Link
                    to={
                      activeMeeting && activeMeeting.appointmentId === nextAppointment.id
                        ? `/student/meeting/${activeMeeting.appointmentId}`
                        : '/student/booking'
                    }
                    className="appointment-button"
                  >
                    {activeMeeting && activeMeeting.appointmentId === nextAppointment.id
                      ? 'Vào phòng tư vấn ngay →'
                      : 'Xem chi tiết lịch hẹn →'}
                  </Link>
                </>
              ) : (
                <>
                  <div className="empty-panel-box">
                    Bạn chưa có lịch hẹn tư vấn nào sắp tới. Đội ngũ chuyên viên luôn sẵn sàng
                    lắng nghe và đồng hành bảo mật 1-1 cùng bạn.
                  </div>

                  <div className="specialist">
                    <img
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=240&q=85"
                      alt="Đội ngũ chuyên viên UniMind"
                      width={46}
                      height={46}
                    />
                    <div>
                      <strong>Đội ngũ Chuyên viên UniMind</strong>
                      <small>Bảo mật thông tin sinh viên &amp; Zero-Trust</small>
                    </div>
                  </div>

                  <Link to="/student/booking" className="appointment-button">
                    Đặt lịch tư vấn ngay →
                  </Link>
                </>
              )}
            </div>
          </section>

          {/* WELLNESS BANNER */}
          <section className="wellness-banner">
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=85"
              alt="Biển bình yên"
            />
            <div className="wellness-overlay" />
            <div className="wellness-text">
              <span>NHẮC NHỞ DỊU DÀNG</span>
              <h3>Mỗi bước nhỏ để chăm sóc bản thân đều đáng tự hào</h3>
              <p>
                Bạn không cần phải gồng mình mạnh mẽ mỗi ngày. Hãy hít thở sâu và cho phép bản thân
                được nghỉ ngơi bất cứ khi nào thấy mỏi.
              </p>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="footer">
            <span>UniMind • Không gian Nhật ký Cảm xúc &amp; Tư vấn Tâm lý Ẩn danh</span>
            <span>Dữ liệu riêng tư được bảo vệ &amp; mã hóa an toàn</span>
          </footer>
        </div>
      </div>

      {/* MOOD CHECK-IN MODAL (PRESERVED FEATURE) */}
      {showMoodModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mood-modal-title"
          onClick={() => {
            if (!savingMood) setShowMoodModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.48)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <form
            onSubmit={handleSaveMood}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
              border: '1px solid #e2ecee',
              fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h2
                  id="mood-modal-title"
                  style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#203138',
                  }}
                >
                  Điểm danh cảm xúc hôm nay
                </h2>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '13.5px',
                    color: '#64767d',
                    lineHeight: 1.5,
                  }}
                >
                  Chia sẻ trạng thái hiện tại để UniMind đồng hành tốt hơn cùng bạn.
                </p>
              </div>
              <button
                type="button"
                disabled={savingMood}
                onClick={() => setShowMoodModal(false)}
                aria-label="Đóng hộp thoại"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: '1px solid #dde7ea',
                  background: '#ffffff',
                  color: '#64767d',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '13px',
                }}
              >
                {modalError}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#34474e',
                  marginBottom: '10px',
                }}
              >
                Hôm nay bạn cảm thấy thế nào?
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px',
                }}
              >
                {Object.entries(MOOD_OPTIONS).map(([keyStr, opt]) => {
                  const key = Number(keyStr);
                  const isActive = selectedMood === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedMood(key)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px 6px',
                        borderRadius: '14px',
                        border: isActive
                          ? `2px solid ${opt.color}`
                          : '1px solid #e2ecee',
                        background: isActive ? opt.bg : '#f9fbfb',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '22px', lineHeight: 1 }}>{opt.icon}</span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? opt.color : '#475960',
                        }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <label
                  htmlFor="mood-energy-range"
                  style={{ fontSize: '13px', fontWeight: 700, color: '#34474e' }}
                >
                  Mức năng lượng hiện tại
                </label>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#1f545c',
                    background: '#ebf6f5',
                    padding: '4px 10px',
                    borderRadius: '999px',
                  }}
                >
                  {energyLevel}/10
                </span>
              </div>
              <input
                id="mood-energy-range"
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#1f545c',
                  cursor: 'pointer',
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label
                htmlFor="mood-note-input"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#34474e',
                  marginBottom: '8px',
                }}
              >
                Ghi chú nhanh (không bắt buộc)
              </label>
              <textarea
                id="mood-note-input"
                rows={3}
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder="Điều gì đang khiến bạn vui hoặc bận tâm lúc này?"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '14px',
                  border: '1px solid #d5e2e5',
                  padding: '12px 14px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  color: '#27343a',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginTop: '18px',
                paddingTop: '16px',
                borderTop: '1px solid #eef4f5',
              }}
            >
              <Link
                to="/student/journal"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1f545c',
                  textDecoration: 'none',
                }}
              >
                Viết nhật ký chi tiết &amp; phân tích AI →
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="s-btn s-btn-outline"
                  disabled={savingMood}
                  onClick={() => setShowMoodModal(false)}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    borderRadius: '12px',
                    border: '1px solid #d5e2e5',
                    background: '#ffffff',
                    color: '#34474e',
                    fontWeight: 600,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="s-btn s-btn-primary"
                  disabled={savingMood}
                  style={{
                    height: '40px',
                    padding: '0 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: savingMood ? '#6a9398' : '#1f545c',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: savingMood ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingMood ? 'Đang lưu...' : 'Lưu tâm trạng'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
