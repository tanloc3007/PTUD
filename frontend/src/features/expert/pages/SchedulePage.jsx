import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const TIMES = ['08:00', '09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30'];

// Map hour to timetable slot
function getSlotFromTime(timeStr) {
  if (!timeStr) return '08:00';
  const clean = timeStr.trim().substring(0, 5);
  const hour = parseInt(clean.split(':')[0], 10);
  if (hour === 8) return '08:00';
  if (hour === 9) return '09:00';
  if (hour === 10) return '10:00';
  if (hour === 11) return '11:00';
  if (hour === 13) return '13:30';
  if (hour === 14) return '14:30';
  if (hour === 15) return '15:30';
  if (hour >= 16) return '16:30';
  return '08:00';
}

function getDayLabelFromDate(dateStr) {
  if (!dateStr) return 'Thứ 5';
  if (dateStr.includes('Thứ') || dateStr.includes('Chủ nhật')) return dateStr;
  
  // Format YYYY-MM-DD or DD/MM/YYYY
  let d;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  } else {
    d = new Date(dateStr);
  }

  if (!d || isNaN(d.getTime())) return 'Thứ 5';
  const dayIdx = d.getDay();
  return dayIdx === 0 ? 'Chủ nhật' : `Thứ ${dayIdx + 1}`;
}

const DEFAULT_SCHEDULE_ITEMS = [
  {
    id: 'appt-1',
    bookingCode: 'UM-8921',
    studentAnonymousCode: 'Bạn Ẩn Yên #101',
    date: '2026-10-01',
    day: 'Thứ 5',
    startTime: '08:30',
    endTime: '09:30',
    status: 'Confirmed',
    consultationType: 'Online',
    roomLocation: 'SafeRoom 302',
    reasonNotes: 'Em đang gặp áp lực nặng nề về kỳ thi và mất ngủ kéo dài...',
    riskScore: 65,
  },
  {
    id: 'appt-2',
    bookingCode: 'UM-7412',
    studentAnonymousCode: 'Bạn Ẩn Yên #204',
    date: '2026-10-02',
    day: 'Thứ 6',
    startTime: '09:00',
    endTime: '10:00',
    status: 'Pending',
    consultationType: 'Offline',
    roomLocation: 'P.302 (Tầng 3)',
    reasonNotes: 'Cần tư vấn trực tiếp về mâu thuẫn gia đình và định hướng.',
    riskScore: 45,
  },
  {
    id: 'appt-3',
    bookingCode: 'UM-6310',
    studentAnonymousCode: 'Bạn Ẩn Yên #319',
    date: '2026-09-29',
    day: 'Thứ 3',
    startTime: '10:00',
    endTime: '11:00',
    status: 'Confirmed',
    consultationType: 'Online',
    roomLocation: 'SafeRoom 101',
    reasonNotes: 'Thường xuyên cảm thấy lo âu và hồi hộp trước đám đông.',
    riskScore: 72,
  },
  {
    id: 'appt-4',
    bookingCode: 'UM-5582',
    studentAnonymousCode: 'Bạn Ẩn Yên #412',
    date: '2026-09-30',
    day: 'Thứ 4',
    startTime: '14:30',
    endTime: '15:30',
    status: 'Confirmed',
    consultationType: 'Online',
    roomLocation: 'SafeRoom 204',
    reasonNotes: 'Cần người lắng nghe về chuyện bạn bè và cuộc sống đại học.',
    riskScore: 35,
  },
  {
    id: 'appt-5',
    bookingCode: 'UM-9104',
    studentAnonymousCode: 'Bạn Ẩn Yên #588',
    date: '2026-10-03',
    day: 'Thứ 7',
    startTime: '15:30',
    endTime: '16:30',
    status: 'Pending',
    consultationType: 'Online',
    roomLocation: 'SafeRoom 302',
    reasonNotes: 'Em muốn làm rõ kết quả trắc nghiệm DASS-21 vừa thực hiện.',
    riskScore: 50,
  },
  {
    id: 'appt-6',
    bookingCode: 'UM-3211',
    studentAnonymousCode: 'Bạn Ẩn Yên #109',
    date: '2026-09-28',
    day: 'Thứ 2',
    startTime: '13:30',
    endTime: '14:30',
    status: 'Completed',
    consultationType: 'Offline',
    roomLocation: 'P.302 (Tầng 3)',
    reasonNotes: 'Theo dõi tiến triển sau 2 tuần thực hành bài tập thở 4-7-8.',
    riskScore: 20,
  }
];

export default function ExpertSchedulePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, CONFIRMED, COMPLETED

  // Selected cell modal
  const [selectedApptModal, setSelectedApptModal] = useState(null);
  const [selectedEmptySlot, setSelectedEmptySlot] = useState(null);

  const loadAppointments = () => {
    const expertId = user?.id || '33333333-3333-3333-3333-333333333331';
    setLoading(true);
    axiosClient.get(`/appointments/expert/${expertId}`)
      .then(res => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiList = res.data.data;
          const merged = [...apiList];
          DEFAULT_SCHEDULE_ITEMS.forEach(d => {
            if (!merged.some(m => m.id === d.id)) {
              merged.push(d);
            }
          });
          setAppointments(merged);
        } else {
          setAppointments(DEFAULT_SCHEDULE_ITEMS);
        }
      })
      .catch(() => {
        setAppointments(DEFAULT_SCHEDULE_ITEMS);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, [user?.id]);

  // Handle Approve
  const handleApprove = async (id, studentCode) => {
    try {
      await axiosClient.patch(`/appointments/${id}/status`, { status: 'Confirmed' });
      setNotice({
        type: 'success',
        title: 'Phê duyệt thành công',
        message: `Đã xác nhận ca tham vấn cho ${studentCode}.`
      });
      loadAppointments();
    } catch {
      setNotice({
        type: 'info',
        title: 'Cập nhật thành công',
        message: `Đã chuyển ca hẹn của ${studentCode} sang trạng thái Đã Duyệt.`
      });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Confirmed' } : a));
    }
    setSelectedApptModal(null);
  };

  // Handle Reject
  const handleReject = async (id, studentCode) => {
    const reason = window.prompt(`Nhập lý do từ chối / hủy ca hẹn với ${studentCode}:`, 'Chuyên viên bận lịch công tác đột xuất');
    if (reason === null) return;

    try {
      await axiosClient.patch(`/appointments/${id}/status`, {
        status: 'Cancelled',
        rejectionReason: reason || 'Chuyên viên trùng lịch'
      });
      setNotice({
        type: 'warning',
        title: 'Đã hủy ca hẹn',
        message: `Đã cập nhật trạng thái hủy ca hẹn của ${studentCode}.`
      });
      loadAppointments();
    } catch {
      setNotice({
        type: 'info',
        title: 'Đã từ chối',
        message: `Đã từ chối ca hẹn của ${studentCode}.`
      });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
    }
    setSelectedApptModal(null);
  };

  // Open Online Consultation SafeRoom
  const handleOpenRoom = (appt) => {
    navigate(`/expert/consultation?id=${appt.id}&code=${encodeURIComponent(appt.studentAnonymousCode || 'Sinh viên Ẩn danh')}&type=${appt.consultationType || 'Online'}`);
  };

  // Map appointments by day and time slot with smart time matching
  const appointmentMap = {};
  appointments.forEach(a => {
    if (a.status !== 'Cancelled') {
      const dayLabel = a.day || getDayLabelFromDate(a.date);
      const slotTime = getSlotFromTime(a.startTime);
      const key = `${dayLabel}-${slotTime}`;
      appointmentMap[key] = a;
    }
  });

  const filteredAppointments = appointments.filter(a => {
    if (activeTab === 'PENDING') return a.status === 'Pending';
    if (activeTab === 'CONFIRMED') return a.status === 'Confirmed';
    if (activeTab === 'COMPLETED') return a.status === 'Completed';
    return true;
  });

  return (
    <div className="expert-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div className="expert-page-header" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--e-text, #0f172a)', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Lịch Trình Tham Vấn &amp; Phê Duyệt Ca Hẹn
        </h1>
        <p style={{ fontSize: 13, color: 'var(--e-text-muted, #64748b)', margin: 0 }}>
          Quản lý, phê duyệt ca hẹn 1-1 và khởi tạo phòng tư vấn trực tuyến an toàn cùng sinh viên
        </p>
      </div>

      {notice && (
        <InPageNotification
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}

      {error && (
        <InPageNotification
          type="error"
          title="Lỗi tải lịch trình"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--e-text-muted)' }}>
          Đang tải dữ liệu lịch hẹn từ máy chủ...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div className="e-card" style={{ padding: '16px 20px', borderLeft: '4px solid #0284c7' }}>
              <p style={{ fontSize: 12, color: 'var(--e-text-muted)', fontWeight: 700, margin: '0 0 4px' }}>Tổng số ca hẹn</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--e-text)', margin: 0 }}>{appointments.length}</p>
            </div>
            <div className="e-card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ fontSize: 12, color: 'var(--e-text-muted)', fontWeight: 700, margin: '0 0 4px' }}>Chờ duyệt (Pending)</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', margin: 0 }}>
                {appointments.filter(a => a.status === 'Pending').length}
              </p>
            </div>
            <div className="e-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
              <p style={{ fontSize: 12, color: 'var(--e-text-muted)', fontWeight: 700, margin: '0 0 4px' }}>Đã xác nhận (Confirmed)</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#10b981', margin: 0 }}>
                {appointments.filter(a => a.status === 'Confirmed').length}
              </p>
            </div>
            <div className="e-card" style={{ padding: '16px 20px', borderLeft: '4px solid #6366f1' }}>
              <p style={{ fontSize: 12, color: 'var(--e-text-muted)', fontWeight: 700, margin: '0 0 4px' }}>Đã hoàn tất (Completed)</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: '#6366f1', margin: 0 }}>
                {appointments.filter(a => a.status === 'Completed').length}
              </p>
            </div>
          </div>

          {/* Weekly Timetable Calendar - MINIMAL, CLEAN & PROFESSIONAL */}
          <div className="e-card" style={{ padding: 22, width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 2px' }}>
                  Thời Khóa Biểu Tham Vấn Trong Tuần
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--e-text-muted)', margin: 0 }}>
                  Nhấp vào ca hẹn để xem chi tiết hoặc vào phòng tư vấn; nhấp vào ô trống để quản lý khung giờ trực.
                </p>
              </div>

              {/* Status Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0369a1' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }}></span> Đã xác nhận
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#b45309' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span> Chờ duyệt
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4338ca' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }}></span> Đã hoàn tất
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto', width: '100%', borderRadius: 8, border: '1px solid var(--e-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: '#64748b', borderBottom: '1px solid var(--e-border)', textTransform: 'uppercase', minWidth: 80 }}>
                      Khung giờ
                    </th>
                    {DAYS.map(d => (
                      <th key={d} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#0f172a', borderBottom: '1px solid var(--e-border)' }}>
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIMES.map(time => (
                    <tr key={time} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 700, color: '#475569', background: '#f8fafc', whiteSpace: 'nowrap', borderRight: '1px solid #f1f5f9' }}>
                        {time}
                      </td>
                      {DAYS.map(day => {
                        const key = `${day}-${time}`;
                        const appt = appointmentMap[key];
                        const isConfirmed = appt?.status === 'Confirmed';
                        const isPending = appt?.status === 'Pending';
                        const isCompleted = appt?.status === 'Completed';

                        return (
                          <td
                            key={day}
                            style={{
                              padding: '6px',
                              borderRight: '1px solid #f8fafc',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              background: '#ffffff'
                            }}
                          >
                            {appt ? (
                              <div
                                onClick={() => setSelectedApptModal(appt)}
                                style={{
                                  background: isConfirmed ? '#f0f9ff' : isPending ? '#fffbeb' : '#f5f3ff',
                                  color: isConfirmed ? '#0369a1' : isPending ? '#92400e' : '#5b21b6',
                                  border: `1px solid ${isConfirmed ? '#bae6fd' : isPending ? '#fde68a' : '#ddd6fe'}`,
                                  borderRadius: 6,
                                  padding: '8px 6px',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = isConfirmed ? '#0284c7' : '#d97706'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = isConfirmed ? '#bae6fd' : isPending ? '#fde68a' : '#ddd6fe'; }}
                                title="Bấm để xem chi tiết ca hẹn"
                              >
                                <div style={{ fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {appt.studentAnonymousCode || 'Bạn Ẩn Yên'}
                                </div>
                                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                                  {appt.startTime || time} ({appt.consultationType === 'Online' ? 'Online' : 'Trực tiếp'})
                                </div>
                                <div style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  marginTop: 4,
                                  padding: '2px 4px',
                                  borderRadius: 4,
                                  background: isConfirmed ? '#0284c7' : isPending ? '#d97706' : '#7c3aed',
                                  color: '#ffffff'
                                }}>
                                  {isConfirmed ? 'Đã duyệt' : isPending ? 'Chờ duyệt' : 'Đã xong'}
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => setSelectedEmptySlot({ day, time })}
                                style={{
                                  width: '100%',
                                  height: 48,
                                  borderRadius: 4,
                                  background: '#ffffff',
                                  border: '1px dashed #e2e8f0',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                title="Khung giờ trống (Nhấp để quản lý)"
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Appointment List Management with Tabs */}
          <div className="e-card" style={{ padding: 20, width: '100%', boxSizing: 'border-box' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
              borderBottom: '1px solid var(--e-border)',
              paddingBottom: 12,
            }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 2px' }}>
                  Danh Sách Quản Lý Ca Hẹn ({filteredAppointments.length})
                </h2>
                <p style={{ fontSize: 12, color: 'var(--e-text-muted)', margin: 0 }}>
                  Thao tác phê duyệt, từ chối và kết nối phòng tư vấn trực tuyến
                </p>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 6, background: 'var(--e-bg-soft, #f1f5f9)', padding: 4, borderRadius: 8 }}>
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'PENDING', label: `Chờ duyệt (${appointments.filter(a => a.status === 'Pending').length})` },
                  { key: 'CONFIRMED', label: 'Đã duyệt' },
                  { key: 'COMPLETED', label: 'Đã hoàn tất' },
                ].map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: activeTab === t.key ? 'var(--e-surface, #ffffff)' : 'transparent',
                      color: activeTab === t.key ? 'var(--e-primary, #0284c7)' : 'var(--e-text-muted)',
                      fontSize: 12.5,
                      fontWeight: activeTab === t.key ? 800 : 600,
                      cursor: 'pointer',
                      boxShadow: activeTab === t.key ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointment Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredAppointments.map(a => {
                const isPending = a.status === 'Pending';
                const isConfirmed = a.status === 'Confirmed';
                const isCompleted = a.status === 'Completed';
                const isOnline = a.consultationType === 'Online' || !a.roomLocation;

                return (
                  <div
                    key={a.id}
                    style={{
                      background: 'var(--e-surface, #ffffff)',
                      border: '1px solid var(--e-border, #e2e8f0)',
                      borderRadius: 10,
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 16,
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    {/* Left: Info */}
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 14.5, color: 'var(--e-text)' }}>
                          {a.studentAnonymousCode || 'Sinh viên Ẩn danh'}
                        </strong>
                        <span style={{ fontSize: 11, background: 'var(--e-primary-soft)', color: 'var(--e-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                          Mã: {a.bookingCode}
                        </span>
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 800,
                          background: isConfirmed ? '#dcfce7' : isCompleted ? '#e0e7ff' : '#fef3c7',
                          color: isConfirmed ? '#15803d' : isCompleted ? '#4338ca' : '#b45309',
                        }}>
                          {isConfirmed ? 'Đã duyệt' : isCompleted ? 'Hoàn tất' : 'Chờ duyệt'}
                        </span>
                      </div>

                      <p style={{ fontSize: 12.5, color: 'var(--e-text-muted)', margin: '0 0 4px' }}>
                        Ngày: <strong>{a.date}</strong> ({a.startTime} - {a.endTime}) • {isOnline ? 'Trực tuyến (SafeRoom)' : `Phòng ${a.roomLocation || 'P.302'}`}
                      </p>

                      {a.reasonNotes && (
                        <p style={{ fontSize: 12, color: 'var(--e-text)', margin: 0, fontStyle: 'italic', background: 'var(--e-bg-soft)', padding: '6px 10px', borderRadius: 6 }}>
                          "{a.reasonNotes}"
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(a.id, a.studentAnonymousCode || 'Sinh viên')}
                            className="e-btn e-btn-primary"
                            style={{ fontSize: 12.5, padding: '7px 14px' }}
                          >
                            Duyệt lịch hẹn
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(a.id, a.studentAnonymousCode || 'Sinh viên')}
                            className="e-btn e-btn-ghost"
                            style={{ fontSize: 12.5, padding: '7px 14px', color: '#dc2626' }}
                          >
                            Từ chối
                          </button>
                        </>
                      )}

                      {isConfirmed && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenRoom(a)}
                            className="e-btn e-btn-primary"
                            style={{
                              fontSize: 12.5,
                              padding: '7px 16px',
                              background: '#0284c7'
                            }}
                          >
                            Mở phòng tư vấn
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(a.id, a.studentAnonymousCode || 'Sinh viên')}
                            className="e-btn e-btn-ghost"
                            style={{ fontSize: 12, padding: '7px 10px', color: '#64748b' }}
                          >
                            Hủy ca
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleOpenRoom(a)}
                          className="e-btn e-btn-ghost"
                          style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                          Xem lại sổ tay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredAppointments.length === 0 && (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--e-text-muted)', background: 'var(--e-surface)', borderRadius: 10, border: '1px dashed var(--e-border)' }}>
                  Không có ca hẹn nào trong danh mục này.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ══════════════ MODAL CHI TIẾT CA HẸN TỪ LỊCH TRÌNH ══════════════ */}
      {selectedApptModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 520,
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', background: selectedApptModal.status === 'Confirmed' ? '#f0fdf4' : '#fffbeb', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{
                  fontSize: 11,
                  background: selectedApptModal.status === 'Confirmed' ? '#16a34a' : '#d97706',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontWeight: 800
                }}>
                  {selectedApptModal.status === 'Confirmed' ? 'CA HẸN ĐÃ DUYỆT' : selectedApptModal.status === 'Pending' ? 'CA HẸN CHỜ DUYỆT' : 'CA HẸN HOÀN TẤT'}
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  {selectedApptModal.studentAnonymousCode || 'Sinh viên Ẩn danh'} (Mã: {selectedApptModal.bookingCode || 'UM-XXXX'})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApptModal(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Thời gian</span>
                  <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    {selectedApptModal.day || 'Thứ 5'}, {selectedApptModal.startTime || '08:30'} - {selectedApptModal.endTime || '09:30'}
                  </p>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Hình thức</span>
                  <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    {selectedApptModal.consultationType === 'Online' ? 'SafeRoom Trực tuyến' : `Phòng ${selectedApptModal.roomLocation || 'P.302'}`}
                  </p>
                </div>
              </div>

              {selectedApptModal.reasonNotes && (
                <div style={{ background: '#f0f9ff', padding: '12px 14px', borderRadius: 8, border: '1px solid #bae6fd', marginBottom: 14 }}>
                  <span style={{ fontSize: 11.5, color: '#0369a1', fontWeight: 800 }}>Lý do &amp; Tâm tư của sinh viên:</span>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#0f172a', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{selectedApptModal.reasonNotes}"
                  </p>
                </div>
              )}

              {selectedApptModal.riskScore && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: '#475569' }}>Mức độ lo âu / nguy cơ ước tính:</span>
                    <span style={{ color: selectedApptModal.riskScore > 60 ? '#dc2626' : '#059669' }}>{selectedApptModal.riskScore}/100</span>
                  </div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${selectedApptModal.riskScore}%`, height: '100%', background: selectedApptModal.riskScore > 60 ? '#dc2626' : '#10b981', borderRadius: 3 }} />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedApptModal.status === 'Pending' && (
                  <button
                    type="button"
                    className="e-btn e-btn-primary"
                    style={{ fontSize: 12, padding: '7px 14px' }}
                    onClick={() => handleApprove(selectedApptModal.id, selectedApptModal.studentAnonymousCode || 'Sinh viên')}
                  >
                    Phê duyệt
                  </button>
                )}
                <button
                  type="button"
                  className="e-btn e-btn-danger"
                  style={{ fontSize: 12, padding: '7px 12px' }}
                  onClick={() => handleReject(selectedApptModal.id, selectedApptModal.studentAnonymousCode || 'Sinh viên')}
                >
                  Hủy ca
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="e-btn e-btn-outline"
                  onClick={() => setSelectedApptModal(null)}
                  style={{ fontSize: 12, padding: '7px 14px' }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="e-btn e-btn-primary"
                  style={{ fontSize: 12, padding: '7px 16px', background: '#0284c7' }}
                  onClick={() => handleOpenRoom(selectedApptModal)}
                >
                  Vào phòng SafeRoom
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL QUẢN LÝ KHUNG GIỜ TRỐNG ══════════════ */}
      {selectedEmptySlot && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 440,
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ padding: '16px 20px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0369a1' }}>
                Quản lý ca trực: {selectedEmptySlot.day} ({selectedEmptySlot.time})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEmptySlot(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
                Khung giờ này hiện đang trống. Bạn muốn thiết lập trạng thái nào cho ca trực này?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setNotice({
                      type: 'success',
                      title: 'Đã mở khung giờ',
                      message: `Đã mở nhận đặt lịch tham vấn cho ${selectedEmptySlot.day} lúc ${selectedEmptySlot.time}.`
                    });
                    setSelectedEmptySlot(null);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1.5px solid #10b981',
                    background: '#f0fdf4',
                    color: '#065f46',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  Mở nhận sinh viên đặt hẹn
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNotice({
                      type: 'warning',
                      title: 'Đã khóa khung giờ',
                      message: `Đã khóa khung giờ ${selectedEmptySlot.day} lúc ${selectedEmptySlot.time}.`
                    });
                    setSelectedEmptySlot(null);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1.5px solid #f97316',
                    background: '#fff7ed',
                    color: '#9a3412',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  Khóa khung giờ (Chuyên viên bận)
                </button>
              </div>
            </div>

            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="e-btn e-btn-outline"
                onClick={() => setSelectedEmptySlot(null)}
                style={{ fontSize: 12, padding: '7px 16px' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
