import { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

const DEFAULT_HOURS = ['08:30', '09:45', '11:00', '13:30', '14:45', '16:00'];

const MOCK_EXPERTS = [
  {
    id: '44444444-4444-4444-4444-444444444440',
    fullName: 'Chuyên viên Tư Vấn Mẫu (Demo)',
    specialization: 'Tâm lý Học đường & Hướng nghiệp sinh viên',
    academicDegree: 'Thạc sĩ Tâm lý học Lâm sàng',
    roomLocation: 'P.302 (Tầng 3) - Tòa nhà Hỗ trợ Sinh viên',
    rating: 5.0,
    totalConsultations: 100,
    availableSlots: [
      { id: 's01', startTime: '08:30', endTime: '09:30', isBooked: false },
      { id: 's02', startTime: '10:00', endTime: '11:00', isBooked: false },
      { id: 's03', startTime: '14:00', endTime: '15:00', isBooked: false },
    ]
  },
  {
    id: '44444444-4444-4444-4444-444444444441',
    fullName: 'ThS. Tâm lý Nguyễn Thanh Hà',
    specialization: 'Áp lực học tập, đồ án & Trị liệu nhận thức (CBT)',
    academicDegree: 'Thạc sĩ Tâm lý học Lâm sàng ĐHQG',
    roomLocation: 'P.302 (Tầng 3) - Tòa nhà Hỗ trợ Sinh viên',
    rating: 4.98,
    totalConsultations: 1420,
    availableSlots: [
      { id: 's1', startTime: '08:30', endTime: '09:30', isBooked: false },
      { id: 's2', startTime: '09:45', endTime: '10:45', isBooked: false },
      { id: 's3', startTime: '14:00', endTime: '15:00', isBooked: false },
    ]
  },
  {
    id: '44444444-4444-4444-4444-444444444442',
    fullName: 'TS. Tâm lý Trần Mai Lan',
    specialization: 'Trầm cảm, Rối loạn âu lo & Khủng hoảng tâm lý',
    academicDegree: 'Tiến sĩ Tâm lý học lâm sàng',
    roomLocation: 'P.303 (Tầng 3) - Tòa nhà Hỗ trợ Sinh viên',
    rating: 5.0,
    totalConsultations: 2100,
    availableSlots: [
      { id: 's4', startTime: '09:00', endTime: '10:00', isBooked: false },
      { id: 's5', startTime: '14:30', endTime: '15:30', isBooked: false },
    ]
  },
  {
    id: '44444444-4444-4444-4444-444444444443',
    fullName: 'ThS. Lê Quốc Bảo',
    specialization: 'Định hướng tương lai & Nghề nghiệp',
    academicDegree: 'Thạc sĩ Tâm lý Phát triển',
    roomLocation: 'P.302 (Tầng 3) - Tòa nhà Hỗ trợ Sinh viên',
    rating: 4.95,
    totalConsultations: 980,
    availableSlots: [
      { id: 's6', startTime: '10:00', endTime: '11:00', isBooked: false },
      { id: 's7', startTime: '15:30', endTime: '16:30', isBooked: false },
    ]
  },
];

function ExpertCard({ expert, isSelected, onSelect }) {
  const specialty = expert.specialization || expert.specialty || 'Tư vấn tâm lý học đường';
  const sessions = expert.totalConsultations ?? expert.totalSessions ?? 50;
  const rating = expert.rating || 5.0;
  const degree = expert.academicDegree || expert.title || 'Chuyên viên';
  const initial = (expert.fullName || 'E').split(' ').pop()?.[0] || 'E';

  return (
    <button
      type="button"
      onClick={() => onSelect(expert)}
      style={{
        display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 18px',
        border: `2px solid ${isSelected ? 'var(--s-primary)' : 'var(--s-border)'}`,
        borderRadius: 14, background: isSelected ? 'var(--s-primary-muted)' : 'var(--s-surface)',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        transition: 'all 0.2s',
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      <div
        className="s-anon-avatar"
        style={{
          background: `hsl(${expert.id?.toString().charCodeAt(0) * 45 || 160}, 45%, 38%)`,
          width: 44, height: 44, fontSize: 16, flexShrink: 0, fontWeight: 800, color: '#fff',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {initial}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--s-text)', margin: 0 }}>
            {expert.fullName}
          </p>
          <span style={{ fontSize: 11, background: 'var(--s-primary-soft)', color: 'var(--s-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
            {degree}
          </span>
          {isSelected && (
            <span style={{ fontSize: 11, background: 'var(--s-primary)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontWeight: 700, marginLeft: 'auto' }}>
              Đang chọn
            </span>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--s-primary)', margin: '4px 0', fontWeight: 600 }}>
          {specialty}
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
          <span style={{ fontSize: 11.5, color: 'var(--s-text-muted)' }}>Đánh giá: {rating}/5.0</span>
          <span style={{ fontSize: 11.5, color: 'var(--s-text-muted)' }}>{sessions} ca tham vấn</span>
          <span style={{ fontSize: 11.5, color: 'var(--s-text-muted)' }}>{expert.roomLocation || 'Phòng tư vấn sinh viên'}</span>
        </div>
      </div>
    </button>
  );
}

export default function BookingPage() {
  const { user } = useAuthStore();
  const [step, setStep]             = useState(1); // 1: chọn expert, 2: chọn ngày/giờ, 3: xác nhận
  const [experts, setExperts]       = useState(MOCK_EXPERTS);
  const [selected, setSelected]     = useState(null);
  
  // Quản lý ngày đặt lịch linh hoạt (Tuần này, Tuần sau, Tháng sau)
  const [weekOffset, setWeekOffset] = useState(0); // 0 = tuần này, 1 = tuần sau, 2 = 2 tuần tới, 4 = tháng sau
  const [selectedDate, setDate]     = useState(new Date());
  const [selectedSlot, setSlot]     = useState(null);
  const [consultType, setConsultType] = useState('Physical'); // Physical | Online
  const [note, setNote]             = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [expertBookings, setExpertBookings] = useState([]); // Danh sách các lịch đã book của chuyên gia để chống trùng
  const [activeTab, setActiveTab]   = useState('new'); // 'new' | 'history'
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Dữ liệu cảm xúc & lịch sử sinh viên để liên kết vào buổi tư vấn
  const [studentMoodProfile, setStudentMoodProfile] = useState({
    recentMoods: [],
    dominantMood: 'Đang tải...',
    latestTest: null,
    postCount: 0,
    attachProfile: true
  });

  // Tạo danh sách 7 ngày dựa trên weekOffset
  const dateList = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + (weekOffset * 7) + i);
      return d;
    });
  }, [weekOffset]);

  // Tải danh sách chuyên gia từ backend
  useEffect(() => {
    axiosClient.get('/appointments/experts')
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data) && r.data.data.length > 0) {
          setExperts(r.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Tải các ca đã được đặt của chuyên gia đang chọn (Để chống trùng lịch 100%)
  useEffect(() => {
    if (selected?.id) {
      axiosClient.get(`/appointments/expert/${selected.id}`)
        .then(r => {
          if (r.data?.data && Array.isArray(r.data.data)) {
            setExpertBookings(r.data.data);
          }
        })
        .catch(() => {});
    }
  }, [selected?.id]);

  // Tải lịch sử & cảm xúc tổng quan của sinh viên hiện tại
  useEffect(() => {
    const studentId = user?.id || '22222222-2222-2222-2222-222222222221';
    
    // 1. Lấy nhật ký cảm xúc gần đây
    axiosClient.get(`/mood-journals/student/${studentId}`)
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data)) {
          const list = r.data.data;
          const moodNames = {
            Sad: 'Rất tệ', Stressed: 'Căng thẳng', Exhausted: 'Mệt mỏi', Peaceful: 'Khá ổn', Great: 'Tuyệt vời'
          };
          const dominant = list.length > 0 ? (moodNames[list[0].moodState] || list[0].moodState) : 'Cân bằng';
          setStudentMoodProfile(prev => ({
            ...prev,
            recentMoods: list.slice(0, 5),
            dominantMood: dominant
          }));
        }
      })
      .catch(() => {});

    // 2. Lấy kết quả DASS-21 gần nhất
    axiosClient.get(`/psychological-tests/student/${studentId}/latest`)
      .then(r => {
        if (r.data?.data) {
          setStudentMoodProfile(prev => ({
            ...prev,
            latestTest: r.data.data
          }));
        }
      })
      .catch(() => {});

    // 3. Lấy số lượng bài viết tâm sự cộng đồng
    axiosClient.get('/community/posts')
      .then(r => {
        if (r.data?.data && Array.isArray(r.data.data)) {
          const myPosts = r.data.data.filter(p => p.anonymousPseudonym === user?.anonymousCode || p.studentId === studentId);
          setStudentMoodProfile(prev => ({
            ...prev,
            postCount: myPosts.length
          }));
        }
      })
      .catch(() => {});
  }, [user?.id, user?.anonymousCode]);

  // Tải lịch sử cuộc hẹn của sinh viên
  const loadMyBookings = () => {
    if (user?.id) {
      axiosClient.get(`/appointments/student/${user.id}`)
        .then(r => {
          if (r.data?.data) setMyBookings(r.data.data);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    loadMyBookings();
  }, [user?.id]);

  // Tính toán khung giờ khả dụng cho ngày đã chọn & KIỂM TRA CHỐNG TRÙNG LỊCH (Double Booking)
  const availableSlotsForDate = useMemo(() => {
    if (!selected) return [];

    const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
    const rawSlots = selected.availableSlots || selected.slots || [];

    // Danh sách các giờ đã bị book bởi người khác trong ngày này
    const bookedTimesOnThisDate = new Set();
    expertBookings.forEach(b => {
      if (b.date === dateStr && (b.status === 'Confirmed' || b.status === 'Pending')) {
        const t = (b.startTime || '').substring(0, 5);
        if (t) bookedTimesOnThisDate.add(t);
      }
    });

    if (rawSlots.length > 0) {
      return rawSlots.map(s => {
        const timeStr = typeof s === 'string' ? s : (s.startTime || '08:30');
        const endStr  = typeof s === 'object' && s.endTime ? ` - ${s.endTime}` : '';
        const isSlotBookedInDb = s.isBooked || bookedTimesOnThisDate.has(timeStr.substring(0, 5));
        return {
          id: typeof s === 'object' ? s.id : null,
          time: timeStr,
          label: `${timeStr}${endStr}`,
          isBooked: isSlotBookedInDb
        };
      });
    }

    return DEFAULT_HOURS.map(h => {
      const isBooked = bookedTimesOnThisDate.has(h);
      return {
        id: null,
        time: h,
        label: `${h} - ${parseInt(h) + 1}:30`,
        isBooked: isBooked
      };
    });
  }, [selected, selectedDate, expertBookings]);

  const handleConfirm = async () => {
    setBookingError('');
    setSubmitting(true);

    try {
      const studentId = user?.id || '22222222-2222-2222-2222-222222222221';
      const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const timeStr = selectedSlot?.time || selectedSlot?.label?.split(' - ')[0] || '08:30';

      // Xây dựng ghi chú lý do đính kèm tóm tắt cảm xúc & trắc nghiệm DASS-21
      let fullReason = note.trim() || 'Sinh viên đặt lịch tư vấn tâm lý học đường';
      if (studentMoodProfile.attachProfile) {
        let moodSummary = ` [Hồ sơ đính kèm: Tâm trạng chủ đạo: ${studentMoodProfile.dominantMood}`;
        if (studentMoodProfile.latestTest) {
          moodSummary += ` | DASS-21: Trầm cảm ${studentMoodProfile.latestTest.depressionScore}đ, Lo âu ${studentMoodProfile.latestTest.anxietyScore}đ, Căng thẳng ${studentMoodProfile.latestTest.stressScore}đ`;
        }
        moodSummary += ` | Đã chia sẻ ${studentMoodProfile.postCount} bài viết cộng đồng]`;
        fullReason += moodSummary;
      }

      const payload = {
        expertId: selected.id,
        timeSlotId: selectedSlot?.id || null,
        date: dateStr,
        time: timeStr,
        anonymousPseudonym: user?.anonymousCode || user?.fullName || 'Bạn Ẩn Yên #396',
        consultationType: consultType,
        reasonNotes: fullReason
      };

      await axiosClient.post(`/appointments/student/${studentId}/book`, payload);

      setSuccess(true);
      loadMyBookings();

      // Cập nhật lại danh sách booked slots của chuyên gia để lập tức khóa khung giờ vừa đặt
      setExpertBookings(prev => [...prev, { date: dateStr, startTime: timeStr, status: 'Pending' }]);

      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setSelected(null);
        setSlot(null);
        setNote('');
        setActiveTab('history');
      }, 2300);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể đặt lịch do trùng khung giờ hoặc lỗi hệ thống. Vui lòng chọn khung giờ khác.';
      setBookingError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-page-shell">

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--s-text)', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Đặt Lịch Tư Vấn Tâm Lý
        </h1>
        <p style={{ fontSize: 13, color: 'var(--s-text-muted)', margin: 0 }}>
          Kết nối 1-1 với chuyên viên tâm lý — Hoàn toàn bảo mật &amp; ẩn danh
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--s-border)', marginBottom: 24 }}>
        {[
          { k: 'new', label: 'Đặt lịch mới' },
          { k: 'history', label: `Lịch của tôi (${myBookings.length})` }
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setActiveTab(t.k)}
            style={{
              padding: '9px 18px', border: 'none', background: 'none',
              color: activeTab === t.k ? 'var(--s-primary)' : 'var(--s-text-muted)',
              fontWeight: activeTab === t.k ? 800 : 600, fontSize: 13.5,
              borderBottom: `2px solid ${activeTab === t.k ? 'var(--s-primary)' : 'transparent'}`,
              marginBottom: '-2px', cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Lịch của tôi */}
      {activeTab === 'history' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--s-surface)', borderRadius: 16, border: '1px dashed var(--s-border)', color: 'var(--s-text-muted)' }}>
              <p style={{ fontWeight: 800, margin: '0 0 6px', color: 'var(--s-text)', fontSize: 15 }}>Bạn chưa có lịch hẹn nào</p>
              <p style={{ fontSize: 13, margin: '0 0 16px' }}>Đặt buổi hẹn đầu tiên với chuyên viên tâm lý hoàn toàn miễn phí và ẩn danh.</p>
              <button className="s-btn s-btn-primary" onClick={() => setActiveTab('new')}>
                Đặt lịch tư vấn ngay
              </button>
            </div>
          ) : (
            myBookings.map(b => (
              <div key={b.id} className="s-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontWeight: 800, color: 'var(--s-text)', margin: 0, fontSize: 14.5 }}>
                      {b.expertName || 'Chuyên viên Tâm lý'}
                    </p>
                    <span style={{ fontSize: 11, background: 'var(--s-primary-soft)', color: 'var(--s-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                      Mã: {b.bookingCode || 'ST-XXXX'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--s-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span>Thời gian: {b.date} ({b.startTime} - {b.endTime})</span>
                    <span>Phòng: {b.roomName || 'P.302 (Tầng 3)'}</span>
                    <span>Hình thức: {b.consultationType === 'Online' ? 'Trực tuyến' : 'Trực tiếp'}</span>
                  </p>
                </div>
                <div>
                  <span className={`s-badge ${b.status === 'Confirmed' ? 's-badge-success' : b.status === 'Completed' ? 's-badge-info' : b.status === 'Pending' ? 's-badge-warning' : 's-badge-error'}`}>
                    {b.status === 'Confirmed' ? 'Đã duyệt' : b.status === 'Completed' ? 'Hoàn tất' : b.status === 'Pending' ? 'Chờ duyệt' : 'Đã hủy'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : success ? (
        <div style={{ padding: '20px 0' }}>
          <InPageNotification
            type="success"
            title="Đặt lịch hẹn thành công!"
            message={`Buổi tư vấn với ${selected?.fullName} vào ngày ${selectedDate?.toLocaleDateString('vi-VN')} (${selectedSlot?.label || selectedSlot?.time}) đã được ghi nhận vào hệ thống. Đang chuyển hướng sang lịch của bạn...`}
          />
        </div>
      ) : (
        <>
          {/* Wizard progress */}
          <div className="s-wizard-steps" style={{ marginBottom: 28, display: 'flex', alignItems: 'center' }}>
            {[
              { n: 1, label: 'Chọn chuyên viên' },
              { n: 2, label: 'Chọn ngày & giờ' },
              { n: 3, label: 'Xác nhận' },
            ].map((s, i, arr) => (
              <div key={s.n} className={`s-wizard-step${step === s.n ? ' active' : step > s.n ? ' done' : ''}`} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div
                  className="s-wizard-step-dot"
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: step > s.n ? 'var(--s-primary)' : step === s.n ? 'var(--s-primary)' : 'var(--s-border)',
                    color: step >= s.n ? '#fff' : 'var(--s-text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, flexShrink: 0
                  }}
                >
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className="s-wizard-step-label" style={{ marginLeft: 8, fontSize: 13, fontWeight: step === s.n ? 800 : 600, color: step === s.n ? 'var(--s-primary)' : 'var(--s-text-muted)' }}>
                  {s.label}
                </span>
                {i < arr.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: step > s.n ? 'var(--s-primary)' : 'var(--s-border)', margin: '0 12px' }} />
                )}
              </div>
            ))}
          </div>

          {/* ══════════════ BƯỚC 1: CHỌN CHUYÊN VIÊN ══════════════ */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--s-text-muted)', marginBottom: 14 }}>
                Chọn chuyên viên tư vấn tâm lý phù hợp với vấn đề của bạn:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {experts.map(e => (
                  <ExpertCard key={e.id} expert={e} isSelected={selected?.id === e.id} onSelect={setSelected} />
                ))}
              </div>
              <button
                className="s-btn s-btn-primary"
                disabled={!selected}
                onClick={() => setStep(2)}
                style={{
                  opacity: selected ? 1 : 0.4,
                  cursor: selected ? 'pointer' : 'not-allowed'
                }}
              >
                Tiếp tục chọn ngày giờ →
              </button>
            </div>
          )}

          {/* ══════════════ BƯỚC 2: CHỌN NGÀY & GIỜ ══════════════ */}
          {step === 2 && selected && (
            <div>
              {/* Card thông tin chuyên viên đang chọn */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--s-primary-muted)', borderRadius: 12, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, margin: 0, fontSize: 14, color: 'var(--s-text)' }}>
                    {selected.fullName}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--s-primary)', margin: '2px 0 0', fontWeight: 600 }}>
                    {selected.specialization || selected.specialty || 'Tư vấn tâm lý'} • {selected.roomLocation || 'Phòng tư vấn'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ border: 'none', background: 'none', color: 'var(--s-primary)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                >
                  Đổi chuyên viên
                </button>
              </div>

              {/* Bộ điều hướng chọn tuần / tháng */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--s-text)', margin: 0 }}>
                    Chọn khoảng thời gian đặt lịch:
                  </p>
                  
                  {/* Quick week/month selector */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { offset: 0, label: 'Tuần này' },
                      { offset: 1, label: 'Tuần sau' },
                      { offset: 2, label: '2 tuần tới' },
                      { offset: 4, label: 'Tháng sau' },
                    ].map(w => (
                      <button
                        key={w.offset}
                        type="button"
                        onClick={() => {
                          setWeekOffset(w.offset);
                          const newD = new Date();
                          newD.setDate(newD.getDate() + (w.offset * 7));
                          setDate(newD);
                          setSlot(null);
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: `1.5px solid ${weekOffset === w.offset ? 'var(--s-primary)' : 'var(--s-border)'}`,
                          background: weekOffset === w.offset ? 'var(--s-primary)' : 'var(--s-surface)',
                          color: weekOffset === w.offset ? '#ffffff' : 'var(--s-text-muted)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chọn ngày dạng hàng nút */}
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, marginBottom: 10 }}>
                  {dateList.map(date => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSel   = selectedDate?.toDateString() === date.toDateString();
                    return (
                      <button
                        type="button"
                        key={date.toDateString()}
                        onClick={() => { setDate(date); setSlot(null); }}
                        style={{
                          padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
                          border: `2px solid ${isSel ? 'var(--s-primary)' : 'var(--s-border)'}`,
                          background: isSel ? 'var(--s-primary-soft)' : 'var(--s-surface)',
                          color: isSel ? 'var(--s-primary)' : 'var(--s-text)',
                          fontWeight: 700, textAlign: 'center', minWidth: 82, flexShrink: 0,
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ fontSize: 10.5, color: isSel ? 'var(--s-primary)' : 'var(--s-text-muted)', marginBottom: 4 }}>
                          {date.toLocaleDateString('vi-VN', { weekday: 'short' }).toUpperCase()}
                          {isToday && <span style={{ marginLeft: 4, color: '#16a34a', fontWeight: 800 }}>• NAY</span>}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900 }}>{date.getDate()}/{date.getMonth() + 1}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Hoặc chọn ngày chính xác bằng Date Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--s-surface)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--s-border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--s-text-muted)', fontWeight: 600 }}>Hoặc chọn ngày tùy chỉnh:</span>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={e => {
                      if (e.target.value) {
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        const picked = new Date(y, m - 1, d);
                        setDate(picked);
                        setSlot(null);
                      }
                    }}
                    style={{
                      border: '1px solid var(--s-border)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12.5,
                      fontFamily: "'Manrope', sans-serif",
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--s-primary)', fontWeight: 700, marginLeft: 'auto' }}>
                    Ngày chọn: {selectedDate?.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Chọn giờ & CHỐNG TRÙNG LỊCH TRỰC QUAN */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--s-text-muted)', margin: 0 }}>
                    Chọn khung giờ tư vấn:
                  </p>
                  <div style={{ fontSize: 12, display: 'flex', gap: 10 }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>
                      ✓ {availableSlotsForDate.filter(s => !s.isBooked).length} ca khả dụng
                    </span>
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>
                      ✕ {availableSlotsForDate.filter(s => s.isBooked).length} ca đã kín lịch
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {availableSlotsForDate.map(slot => {
                    const isSlotSel = selectedSlot?.time === slot.time || selectedSlot?.label === slot.label;
                    const isBooked = slot.isBooked;

                    return (
                      <button
                        type="button"
                        key={slot.label}
                        disabled={isBooked}
                        onClick={() => !isBooked && setSlot(slot)}
                        style={{
                          padding: '12px 14px', borderRadius: 10,
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          fontFamily: "'Manrope', sans-serif",
                          border: `2px solid ${isBooked ? '#e2e8f0' : isSlotSel ? 'var(--s-primary)' : 'var(--s-border)'}`,
                          background: isBooked ? '#f1f5f9' : isSlotSel ? 'var(--s-primary)' : 'var(--s-surface)',
                          color: isBooked ? '#94a3b8' : isSlotSel ? '#ffffff' : 'var(--s-text)',
                          fontWeight: 700, fontSize: 13,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          opacity: isBooked ? 0.6 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: 13.5, textDecoration: isBooked ? 'line-through' : 'none' }}>
                          {slot.label}
                        </span>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: isBooked ? '#ef4444' : isSlotSel ? '#ffffff' : '#0d9488',
                          background: isBooked ? '#fee2e2' : isSlotSel ? 'rgba(255,255,255,0.2)' : '#f0fdfa',
                          padding: '2px 8px', borderRadius: 4
                        }}>
                          {isBooked ? 'ĐÃ CÓ NGƯỜI ĐẶT' : 'KHẢ DỤNG'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hình thức tư vấn */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--s-text-muted)', marginBottom: 10 }}>
                  Hình thức buổi tư vấn:
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setConsultType('Physical')}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
                      border: `2px solid ${consultType === 'Physical' ? 'var(--s-primary)' : 'var(--s-border)'}`,
                      background: consultType === 'Physical' ? 'var(--s-primary-soft)' : 'var(--s-surface)',
                      color: consultType === 'Physical' ? 'var(--s-primary)' : 'var(--s-text)',
                      fontWeight: 700, fontSize: 13, textAlign: 'center'
                    }}
                  >
                    Trực tiếp tại phòng tư vấn
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultType('Online')}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
                      border: `2px solid ${consultType === 'Online' ? 'var(--s-primary)' : 'var(--s-border)'}`,
                      background: consultType === 'Online' ? 'var(--s-primary-soft)' : 'var(--s-surface)',
                      color: consultType === 'Online' ? 'var(--s-primary)' : 'var(--s-text)',
                      fontWeight: 700, fontSize: 13, textAlign: 'center'
                    }}
                  >
                    Trực tuyến ẩn danh (SafeRoom)
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="s-btn"
                  style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--s-border)', color: 'var(--s-text-muted)', borderRadius: 10, cursor: 'pointer', fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                  onClick={() => setStep(1)}
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  className="s-btn s-btn-primary"
                  disabled={!selectedDate || !selectedSlot || selectedSlot?.isBooked}
                  onClick={() => setStep(3)}
                  style={{
                    opacity: selectedDate && selectedSlot && !selectedSlot?.isBooked ? 1 : 0.4,
                    cursor: selectedDate && selectedSlot && !selectedSlot?.isBooked ? 'pointer' : 'not-allowed'
                  }}
                >
                  Tiếp tục xác nhận →
                </button>
              </div>
            </div>
          )}

          {/* ══════════════ BƯỚC 3: XÁC NHẬN ĐẶT LỊCH ══════════════ */}
          {step === 3 && (
            <div>
              {bookingError && (
                <InPageNotification
                  type="error"
                  title="Không thể đặt lịch"
                  message={bookingError}
                  onClose={() => setBookingError('')}
                />
              )}

              {/* Thông tin tóm tắt buổi hẹn */}
              <div style={{ background: 'var(--s-surface)', border: '1px solid var(--s-border)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px', color: 'var(--s-text)' }}>
                  Thông tin tóm tắt buổi hẹn
                </h3>
                {[
                  { label: 'Chuyên viên tư vấn',  value: selected?.fullName },
                  { label: 'Học vị / Chuyên môn',   value: `${selected?.academicDegree || 'Chuyên viên'} — ${selected?.specialization || 'Tư vấn tâm lý'}` },
                  { label: 'Ngày hẹn',             value: selectedDate?.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) },
                  { label: 'Khung giờ',            value: selectedSlot?.label || selectedSlot?.time },
                  { label: 'Hình thức',            value: consultType === 'Physical' ? `Trực tiếp tại ${selected?.roomLocation || 'P.302'}` : 'Trực tuyến bảo mật qua SafeRoom' },
                  { label: 'Danh tính của bạn',    value: `${user?.anonymousCode || 'Bí danh tự động bảo mật'}` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--s-border)', fontSize: 13.5 }}>
                    <span style={{ color: 'var(--s-text-muted)', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: 'var(--s-text)', fontWeight: 700 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Khung liên kết hồ sơ cảm xúc & lịch sử đăng bài của sinh viên */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #0d948840', borderRadius: 16, padding: '18px 22px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488' }} />
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f766e' }}>
                      Liên kết hồ sơ cảm xúc &amp; Lịch sử cá nhân
                    </h4>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={studentMoodProfile.attachProfile}
                      onChange={e => setStudentMoodProfile(p => ({ ...p, attachProfile: e.target.checked }))}
                      style={{ accentColor: '#0d9488' }}
                    />
                    Tự động đính kèm cho chuyên gia
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px' }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tâm trạng gần nhất</span>
                    <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 800, color: '#0f766e' }}>
                      {studentMoodProfile.dominantMood}
                    </p>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px' }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Trắc nghiệm DASS-21</span>
                    <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 800, color: '#334155' }}>
                      {studentMoodProfile.latestTest
                        ? `Trầm cảm ${studentMoodProfile.latestTest.depressionScore} | Lo âu ${studentMoodProfile.latestTest.anxietyScore} | Stress ${studentMoodProfile.latestTest.stressScore}`
                        : 'Chưa thực hiện test'}
                    </p>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px' }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Hoạt động chia sẻ</span>
                    <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 800, color: '#334155' }}>
                      {studentMoodProfile.postCount} bài viết trên Góc ẩn danh
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: 11.5, color: '#64748b', margin: '10px 0 0', lineHeight: 1.4 }}>
                  Chuyên viên sẽ dựa vào lịch sử cảm xúc và kết quả DASS-21 để chuẩn bị lộ trình tham vấn phù hợp nhất cho bạn.
                </p>
              </div>

              {/* Nhập ghi chú thêm */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--s-text)', display: 'block', marginBottom: 6 }}>
                  Vấn đề bạn đang gặp phải (Ghi chú bảo mật cho chuyên gia)
                </label>
                <textarea
                  className="s-input"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ví dụ: Căng thẳng mùa thi cử, lo âu mất ngủ, áp lực gia đình và định hướng tương lai..."
                  style={{ minHeight: 90, width: '100%', borderRadius: 10, padding: '10px 14px', border: '1.5px solid var(--s-border)', outline: 'none', fontFamily: "'Manrope', sans-serif", fontSize: 13 }}
                />
              </div>

              <InPageNotification
                type="info"
                message="Quyền riêng tư tuyệt đối: Chuyên viên chỉ thấy bí danh của bạn và không có quyền truy cập MSSV hay họ tên thật."
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="s-btn"
                  style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--s-border)', color: 'var(--s-text-muted)', borderRadius: 10, cursor: 'pointer', fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                  onClick={() => setStep(2)}
                  disabled={submitting}
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  className="s-btn s-btn-primary"
                  onClick={handleConfirm}
                  disabled={submitting}
                  style={{
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Đang xử lý đặt lịch...' : 'Xác nhận đặt lịch hẹn'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
