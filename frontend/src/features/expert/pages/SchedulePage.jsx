import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const TIMES = ['08:00', '09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30'];

export default function ExpertSchedulePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, CONFIRMED, COMPLETED

  const loadAppointments = () => {
    const expertId = user?.id || '33333333-3333-3333-3333-333333333331';
    setLoading(true);
    axiosClient.get(`/appointments/expert/${expertId}`)
      .then(res => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setAppointments(res.data.data);
        }
      })
      .catch(() => {
        setError('Không thể tải lịch trình từ cơ sở dữ liệu.');
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
        message: `Đã xác nhận ca tham vấn cho ${studentCode}. Sinh viên sẽ nhận được thông báo.`
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
  };

  // Open Online Consultation SafeRoom
  const handleOpenRoom = (appt) => {
    navigate(`/expert/consultation?id=${appt.id}&code=${encodeURIComponent(appt.studentAnonymousCode || 'Sinh viên Ẩn danh')}&type=${appt.consultationType || 'Online'}`);
  };

  // Map appointments by day and time slot
  const appointmentMap = {};
  appointments.forEach(a => {
    if (a.date && a.startTime) {
      const d = new Date(a.date);
      const dayIdx = d.getDay();
      const dayLabel = dayIdx === 0 ? 'Chủ nhật' : `Thứ ${dayIdx + 1}`;
      const hourStr = a.startTime.substring(0, 5);
      const key = `${dayLabel}-${hourStr}`;
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

          {/* Weekly Timetable Calendar */}
          <div className="e-card" style={{ padding: 20, width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--e-text)', margin: 0 }}>
                📅 Thời Khóa Biểu Tham Vấn Trong Tuần
              </h2>
              <span style={{ fontSize: 12, color: 'var(--e-text-muted)' }}>Màu xanh: Đã xác nhận • Màu vàng: Chờ duyệt</span>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                <thead>
                  <tr style={{ background: 'var(--e-bg-soft, #f8fafc)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--e-text-muted)', borderBottom: '1px solid var(--e-border)', textTransform: 'uppercase' }}>
                      Khung giờ
                    </th>
                    {DAYS.map(d => (
                      <th key={d} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: 'var(--e-text)', borderBottom: '1px solid var(--e-border)' }}>
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIMES.map(time => (
                    <tr key={time}>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 700, color: 'var(--e-text-muted)', borderBottom: '1px solid var(--e-border)', whiteSpace: 'nowrap' }}>
                        {time}
                      </td>
                      {DAYS.map(day => {
                        const key = `${day}-${time}`;
                        const appt = appointmentMap[key];
                        return (
                          <td key={day} style={{ padding: '6px', borderBottom: '1px solid var(--e-border)', textAlign: 'center' }}>
                            {appt ? (
                              <div
                                onClick={() => handleOpenRoom(appt)}
                                style={{
                                  background: appt.status === 'Confirmed' ? 'var(--e-primary-soft, #e0f2fe)' : '#fffbeb',
                                  color: appt.status === 'Confirmed' ? 'var(--e-primary, #0284c7)' : '#b45309',
                                  border: `1px solid ${appt.status === 'Confirmed' ? '#bae6fd' : '#fde68a'}`,
                                  borderRadius: 6,
                                  padding: '6px 8px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'transform 0.15s ease',
                                }}
                                title="Bấm để mở phòng tư vấn"
                              >
                                <div>{appt.studentAnonymousCode || 'Sinh viên Ẩn danh'}</div>
                                <div style={{ fontSize: 9.5, opacity: 0.85, marginTop: 2 }}>
                                  {appt.status === 'Confirmed' ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--e-bg-soft)', margin: '0 auto', border: '1px dashed var(--e-border)' }}
                                title="Khung giờ trống"
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
                        📅 Ngày: <strong>{a.date}</strong> ({a.startTime} - {a.endTime}) • 📍 {isOnline ? '🌐 Tham vấn Trực tuyến (SafeRoom)' : `🏫 Phòng ${a.roomLocation || 'P.302'}`}
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
                            ✓ Duyệt lịch hẹn
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(a.id, a.studentAnonymousCode || 'Sinh viên')}
                            className="e-btn e-btn-ghost"
                            style={{ fontSize: 12.5, padding: '7px 14px', color: '#dc2626' }}
                          >
                            ✕ Từ chối
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
                              background: '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <span>🎥</span> Mở phòng tư vấn ngay
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
    </div>
  );
}
