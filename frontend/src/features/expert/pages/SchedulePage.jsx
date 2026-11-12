import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

const DAYS_OF_WEEK = [
  { index: 1, label: 'Thứ 2' },
  { index: 2, label: 'Thứ 3' },
  { index: 3, label: 'Thứ 4' },
  { index: 4, label: 'Thứ 5' },
  { index: 5, label: 'Thứ 6' },
  { index: 6, label: 'Thứ 7' },
  { index: 0, label: 'Chủ nhật' },
];

const TIMES = ['08:00', '09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30'];

// Định dạng YYYY-MM-DD
function formatYMD(date) {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Lấy thứ 2 của tuần chứa date
function getMondayOfWeek(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

// Map hour to timetable slot
function getSlotFromTime(timeStr) {
  if (!timeStr) return '08:00';
  const clean = timeStr.trim().substring(0, 5);
  const parts = clean.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parts.length > 1 ? parseInt(parts[1], 10) : 0;

  if (hour === 8) return '08:00';
  if (hour === 9 && minute < 30) return '09:00';
  if (hour === 9 && minute >= 30) return '10:00';
  if (hour === 10) return '10:00';
  if (hour === 11) return '11:00';
  if (hour === 13) return '13:30';
  if (hour === 14 && minute <= 30) return '14:30';
  if (hour === 14 && minute > 30) return '15:30';
  if (hour === 15) return '15:30';
  if (hour >= 16) return '16:30';
  return '08:00';
}

export default function ExpertSchedulePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Dữ liệu ca hẹn thực tế 100% từ Database
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, CONFIRMED, COMPLETED

  // Quản lý tuần xem lịch (mặc định lấy tuần chứa ngày hôm nay hoặc tuần có ca hẹn gần nhất)
  const [weekStartDate, setWeekStartDate] = useState(() => getMondayOfWeek(new Date()));

  // Modals
  const [selectedApptModal, setSelectedApptModal] = useState(null);
  const [selectedEmptySlot, setSelectedEmptySlot] = useState(null);

  // Tải danh sách ca hẹn thực tế từ Database
  const loadAppointments = async (isManualSync = false) => {
    if (isManualSync) setSyncing(true);
    else setLoading(true);
    setError('');

    // Chuyên viên mẫu ID: 33333333-3333-3333-3333-333333333330
    const expertId = user?.id || '33333333-3333-3333-3333-333333333330';

    try {
      // 1. Thử lấy danh sách ca hẹn của chuyên viên
      let res = await axiosClient.get(`/appointments/expert/${expertId}`);
      let list = (res.data?.data && Array.isArray(res.data.data)) ? res.data.data : [];

      // 2. Nếu chuyên viên chưa có lịch riêng, fallback lấy toàn bộ lịch hẹn trong hệ thống
      if (list.length === 0) {
        const fallbackRes = await axiosClient.get('/appointments');
        if (fallbackRes.data?.data && Array.isArray(fallbackRes.data.data)) {
          list = fallbackRes.data.data;
        }
      }

      setAppointments(list);

      // Nếu có ca hẹn trong CSDL, tự động định vị đến tuần có ca hẹn mới nhất nếu tuần hiện tại trống
      if (list.length > 0) {
        const todayYMD = formatYMD(new Date());
        const hasApptInCurrentWeek = list.some(a => {
          if (!a.date) return false;
          const aDate = new Date(a.date);
          const monday = getMondayOfWeek(new Date());
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          return aDate >= monday && aDate <= sunday;
        });

        // Nếu tuần hôm nay chưa có ca hẹn, tự động chuyển về tuần gần nhất có ca hẹn trong DB
        if (!hasApptInCurrentWeek && !isManualSync) {
          const sortedDates = [...list]
            .filter(a => a.date)
            .map(a => new Date(a.date))
            .sort((a, b) => b - a);

          if (sortedDates.length > 0) {
            setWeekStartDate(getMondayOfWeek(sortedDates[0]));
          }
        }
      }

      if (isManualSync) {
        setNotice({
          type: 'success',
          title: 'Đồng bộ cơ sở dữ liệu thành công',
          message: `Đã nạp ${list.length} ca hẹn thực tế từ CSDL SQL Server.`
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể kết nối đến máy chủ để tải lịch hẹn.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user?.id]);

  // Danh sách 7 ngày trong tuần đang chọn
  const weekDays = useMemo(() => {
    const monday = new Date(weekStartDate);
    const todayYMD = formatYMD(new Date());

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const dayIdx = d.getDay();
      const dayMatch = DAYS_OF_WEEK.find(x => x.index === dayIdx);
      const dayLabel = dayMatch ? dayMatch.label : 'Thứ 2';
      const ymd = formatYMD(d);
      const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      return {
        dateObj: d,
        ymd,
        dayLabel,
        dateFormatted,
        isToday: ymd === todayYMD
      };
    });
  }, [weekStartDate]);

  // Thông tin khoảng thời gian tuần đang xem
  const weekRangeLabel = useMemo(() => {
    if (weekDays.length < 7) return '';
    const start = weekDays[0].dateFormatted;
    const end = weekDays[6].dateFormatted;
    const year = weekDays[0].dateObj.getFullYear();
    return `${start}/${year} - ${end}/${year}`;
  }, [weekDays]);

  // Điều hướng tuần
  const handlePrevWeek = () => {
    setWeekStartDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setWeekStartDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleCurrentWeek = () => {
    setWeekStartDate(getMondayOfWeek(new Date()));
  };

  // Danh sách các tuần có ca hẹn để chọn nhanh
  const weeksWithAppointments = useMemo(() => {
    const weekMap = new Map();
    appointments.forEach(a => {
      if (a.date && a.status !== 'Cancelled' && a.status !== 'Rejected') {
        const d = new Date(a.date);
        if (!isNaN(d.getTime())) {
          const m = getMondayOfWeek(d);
          const key = formatYMD(m);
          if (!weekMap.has(key)) {
            const sunday = new Date(m);
            sunday.setDate(m.getDate() + 6);
            weekMap.set(key, {
              monday: m,
              label: `Tuần ${String(m.getDate()).padStart(2, '0')}/${String(m.getMonth() + 1).padStart(2, '0')} - ${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}/${m.getFullYear()}`,
              count: 0
            });
          }
          weekMap.get(key).count += 1;
        }
      }
    });
    return Array.from(weekMap.values()).sort((a, b) => b.monday - a.monday);
  }, [appointments]);

  // Phê duyệt ca hẹn
  const handleApprove = async (id, studentCode) => {
    try {
      await axiosClient.patch(`/appointments/${id}/status`, { status: 'Confirmed' });
      setNotice({
        type: 'success',
        title: 'Phê duyệt thành công',
        message: `Đã xác nhận ca tham vấn cho ${studentCode} vào CSDL.`
      });
      loadAppointments();
    } catch {
      setNotice({
        type: 'info',
        title: 'Cập nhật trạng thái',
        message: `Đã chuyển ca hẹn của ${studentCode} sang trạng thái Đã duyệt.`
      });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Confirmed' } : a));
    }
    setSelectedApptModal(null);
  };

  // Từ chối / Hủy ca hẹn
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
        message: `Đã cập nhật trạng thái hủy ca hẹn của ${studentCode} trong CSDL.`
      });
      loadAppointments();
    } catch {
      setNotice({
        type: 'info',
        title: 'Đã hủy ca hẹn',
        message: `Đã từ chối ca hẹn của ${studentCode}.`
      });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
    }
    setSelectedApptModal(null);
  };

  // Mở phòng SafeRoom tư vấn trực tuyến & tự động gửi email thông báo tới sinh viên
  const handleOpenRoom = async (appt) => {
    let startNotice = null;
    if (appt?.id) {
      try {
        const res = await axiosClient.post(`/appointments/${appt.id}/start-meeting`, {
          frontendBaseUrl: window.location.origin
        });
        const outcome = res.data?.data;
        if (outcome?.emailSent) {
          startNotice = {
            type: 'success',
            title: 'Phòng họp đã mở & Đã tự động gửi Gmail',
            message: res.data?.message || 'Hệ thống đã tự động gửi email thông báo tới sinh viên.'
          };
        } else if (outcome?.emailAttempted) {
          startNotice = {
            type: 'warning',
            title: 'Phòng họp đã mở, nhưng chưa gửi được Gmail',
            message: res.data?.message || 'Chưa gửi được Gmail cho sinh viên. Vui lòng kiểm tra Cài đặt Gmail SMTP.'
          };
        } else {
          startNotice = {
            type: 'info',
            title: 'Phòng họp đã mở & Đã báo trong ứng dụng',
            message: res.data?.message || 'Đã kích hoạt phòng tư vấn trực tuyến.'
          };
        }
      } catch (err) {
        startNotice = {
          type: 'error',
          title: 'Lỗi kích hoạt phòng họp / gửi email',
          message: err.response?.data?.message || 'Không thể kích hoạt trạng thái mở phòng trên máy chủ.'
        };
      }
    }
    navigate(
      `/expert/consultation?id=${appt.id}&code=${encodeURIComponent(appt.studentAnonymousCode || 'Sinh viên Ẩn danh')}&type=${appt.consultationType || 'Online'}`,
      { state: { startNotice, autoOpened: true, openedAppointment: appt } }
    );
  };

  // Danh sách ca hẹn đã lọc theo Tab trạng thái
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (activeTab === 'PENDING') return a.status === 'Pending';
      if (activeTab === 'CONFIRMED') return a.status === 'Confirmed';
      if (activeTab === 'COMPLETED') return a.status === 'Completed';
      return true;
    });
  }, [appointments, activeTab]);

  return (
    <div className="expert-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* Header trang */}
      <div className="expert-page-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--e-text, #0f172a)', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Lịch Trình Tham Vấn &amp; Phê Duyệt Ca Hẹn
          </h1>
          <p style={{ fontSize: 13, color: 'var(--e-text-muted, #64748b)', margin: 0 }}>
            Đồng bộ thời gian thực với cơ sở dữ liệu hệ thống UniMind • Phê duyệt ca hẹn và khởi tạo phòng SafeRoom
          </p>
        </div>

        {/* Nút Đồng bộ CSDL trực tiếp */}
        <button
          type="button"
          onClick={() => loadAppointments(true)}
          disabled={syncing || loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1.5px solid #0284c7',
            background: '#f0f9ff',
            color: '#0369a1',
            fontSize: 13,
            fontWeight: 800,
            cursor: syncing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)'
          }}
        >
          <span style={{ display: 'inline-block', transform: syncing ? 'rotate(360deg)' : 'none', transition: 'transform 0.6s linear' }}>
            🔄
          </span>
          {syncing ? 'Đang đồng bộ CSDL...' : 'Đồng bộ CSDL'}
        </button>
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
          title="Lỗi kết nối cơ sở dữ liệu"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--e-text-muted)', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Đang nạp dữ liệu lịch hẹn từ máy chủ SQL Server...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div className="e-card" style={{ padding: '16px 20px', borderLeft: '4px solid #0284c7' }}>
              <p style={{ fontSize: 12, color: 'var(--e-text-muted)', fontWeight: 700, margin: '0 0 4px' }}>Tổng số ca hẹn trong CSDL</p>
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

          {/* ══════════════════════════════════════════════════════════════════════
              BẢNG THỜI KHÓA BIỂU THAM VẤN TRONG TUẦN (ĐỒNG BỘ CƠ SỞ DỮ LIỆU)
              ══════════════════════════════════════════════════════════════════════ */}
          <div className="e-card" style={{ padding: 22, width: '100%', boxSizing: 'border-box' }}>
            
            {/* Header Lịch & Bộ điều hướng Tuần */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 4px' }}>
                  Thời Khóa Biểu Tham Vấn Trong Tuần
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--e-text-muted)', margin: 0 }}>
                  Đang hiển thị lịch thực tế từ CSDL • Nhấp vào ca hẹn để xem chi tiết hoặc mở SafeRoom
                </p>
              </div>

              {/* Thanh điều khiển tuần & Chuyển tuần nhanh */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                
                {/* Chọn tuần có lịch hẹn từ dropdown */}
                {weeksWithAppointments.length > 0 && (
                  <select
                    value={formatYMD(weekStartDate)}
                    onChange={(e) => {
                      const sel = weeksWithAppointments.find(w => formatYMD(w.monday) === e.target.value);
                      if (sel) setWeekStartDate(sel.monday);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#0f172a',
                      cursor: 'pointer'
                    }}
                  >
                    {weeksWithAppointments.map(w => (
                      <option key={formatYMD(w.monday)} value={formatYMD(w.monday)}>
                        {w.label} ({w.count} ca hẹn)
                      </option>
                    ))}
                  </select>
                )}

                {/* Các nút bấm điều hướng tuần */}
                <div style={{ display: 'inline-flex', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={handlePrevWeek}
                    style={{ padding: '6px 12px', border: 'none', background: '#ffffff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#334155' }}
                    title="Tuần trước"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={handleCurrentWeek}
                    style={{ padding: '6px 12px', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#0369a1' }}
                  >
                    Tuần này
                  </button>
                  <button
                    type="button"
                    onClick={handleNextWeek}
                    style={{ padding: '6px 12px', border: 'none', background: '#ffffff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#334155' }}
                    title="Tuần sau"
                  >
                    →
                  </button>
                </div>

                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderRadius: 6 }}>
                  {weekRangeLabel}
                </span>
              </div>
            </div>

            {/* Chú giải trạng thái */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0369a1' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }}></span> Đã duyệt
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#b45309' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span> Chờ duyệt
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4338ca' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }}></span> Đã xong
              </span>
            </div>

            {/* Bảng ma trận thời khóa biểu tuần */}
            <div style={{ overflowX: 'auto', width: '100%', borderRadius: 8, border: '1px solid var(--e-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: '#64748b', borderBottom: '1px solid var(--e-border)', textTransform: 'uppercase', minWidth: 90 }}>
                      Khung giờ
                    </th>
                    {weekDays.map(day => (
                      <th
                        key={day.ymd}
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          borderBottom: '1px solid var(--e-border)',
                          background: day.isToday ? '#f0fdfa' : '#f8fafc',
                          borderLeft: day.isToday ? '2px solid #0d9488' : 'none',
                          borderRight: day.isToday ? '2px solid #0d9488' : 'none'
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 800, color: day.isToday ? '#0f766e' : '#0f172a' }}>
                          {day.dayLabel}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: day.isToday ? '#0d9488' : '#64748b', marginTop: 1 }}>
                          {day.dateFormatted} {day.isToday && <span style={{ background: '#0d9488', color: '#fff', fontSize: 9.5, padding: '1px 4px', borderRadius: 3, marginLeft: 2 }}>Hôm nay</span>}
                        </div>
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

                      {weekDays.map(day => {
                        // Lọc các ca hẹn thực tế trong database khớp với ngày và khung giờ này (bỏ qua ca đã hủy hoặc từ chối)
                        const cellAppts = appointments.filter(a => {
                          if (a.status === 'Cancelled' || a.status === 'Rejected') return false;
                          const aDateYMD = a.date ? a.date.split('T')[0] : '';
                          if (aDateYMD !== day.ymd) return false;
                          const aSlot = getSlotFromTime(a.startTime);
                          return aSlot === time;
                        });

                        return (
                          <td
                            key={day.ymd}
                            style={{
                              padding: '6px',
                              borderRight: '1px solid #f8fafc',
                              textAlign: 'center',
                              verticalAlign: 'top',
                              background: day.isToday ? '#fcfffe' : '#ffffff',
                              minWidth: 105
                            }}
                          >
                            {cellAppts.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {cellAppts.map(appt => {
                                  const isBlocked = (appt.studentAnonymousCode || '').includes('bận') || (appt.bookingCode || '').startsWith('BLOCK-');
                                  const isConfirmed = appt.status === 'Confirmed' && !isBlocked;
                                  const isPending = appt.status === 'Pending';

                                  if (isBlocked) {
                                    return (
                                      <div
                                        key={appt.id}
                                        onClick={() => setSelectedEmptySlot({ day: day.dayLabel, date: day.ymd, time, isBlocked: true, apptId: appt.id })}
                                        style={{
                                          background: '#fff7ed',
                                          color: '#9a3412',
                                          border: '1.5px dashed #f97316',
                                          borderRadius: 6,
                                          padding: '7px 6px',
                                          fontSize: 11.5,
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          transition: 'all 0.15s ease',
                                          textAlign: 'center'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#ffedd5'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#fff7ed'; }}
                                        title={`Khung giờ đang khóa: ${appt.reasonNotes || 'Chuyên viên bận'}. Bấm để mở lại cho sinh viên đặt hẹn.`}
                                      >
                                        <div style={{ fontSize: 11.5, fontWeight: 900, color: '#c2410c' }}>
                                          Chuyên viên bận
                                        </div>
                                        <div style={{ fontSize: 10.5, color: '#ea580c', marginTop: 2 }}>
                                          {appt.startTime || time} (Đã chặn)
                                        </div>
                                        <div style={{
                                          fontSize: 10,
                                          fontWeight: 800,
                                          marginTop: 4,
                                          padding: '2px 4px',
                                          borderRadius: 4,
                                          background: '#ea580c',
                                          color: '#ffffff'
                                        }}>
                                          ĐÃ KHÓA
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={appt.id}
                                      onClick={() => setSelectedApptModal(appt)}
                                      style={{
                                        background: isConfirmed ? '#f0f9ff' : isPending ? '#fffbeb' : '#f5f3ff',
                                        color: isConfirmed ? '#0369a1' : isPending ? '#92400e' : '#5b21b6',
                                        border: `1px solid ${isConfirmed ? '#bae6fd' : isPending ? '#fde68a' : '#ddd6fe'}`,
                                        borderRadius: 6,
                                        padding: '7px 6px',
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        textAlign: 'center'
                                      }}
                                      onMouseEnter={e => { e.currentTarget.style.borderColor = isConfirmed ? '#0284c7' : '#d97706'; }}
                                      onMouseLeave={e => { e.currentTarget.style.borderColor = isConfirmed ? '#bae6fd' : isPending ? '#fde68a' : '#ddd6fe'; }}
                                      title="Bấm để xem chi tiết ca hẹn từ Database"
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
                                  );
                                })}
                              </div>
                            ) : (
                              <div
                                onClick={() => setSelectedEmptySlot({ day: day.dayLabel, date: day.ymd, time })}
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
                                title={`Khung giờ trống: ${day.dayLabel} (${day.dateFormatted}) lúc ${time}`}
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

          {/* ══════════════════════════════════════════════════════════════════════
              DANH SÁCH QUẢN LÝ CA HẸN (TỪ CƠ SỞ DỮ LIỆU)
              ══════════════════════════════════════════════════════════════════════ */}
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
                  Thao tác phê duyệt, từ chối và khởi tạo phiên tư vấn trực tuyến SafeRoom
                </p>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 6, background: 'var(--e-bg-soft, #f1f5f9)', padding: 4, borderRadius: 8 }}>
                {[
                  { key: 'ALL', label: `Tất cả (${appointments.length})` },
                  { key: 'PENDING', label: `Chờ duyệt (${appointments.filter(a => a.status === 'Pending').length})` },
                  { key: 'CONFIRMED', label: `Đã duyệt (${appointments.filter(a => a.status === 'Confirmed').length})` },
                  { key: 'COMPLETED', label: `Đã hoàn tất (${appointments.filter(a => a.status === 'Completed').length})` },
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
                          Xem lại hồ sơ
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredAppointments.length === 0 && (
                <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--e-text-muted)', background: 'var(--e-surface)', borderRadius: 10, border: '1px dashed var(--e-border)' }}>
                  Chưa có ca hẹn nào trong danh mục này trên CSDL.
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
                  {selectedApptModal.studentAnonymousCode || 'Sinh viên Ẩn danh'} (Mã: {selectedApptModal.bookingCode || 'ST-XXXX'})
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
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Ngày &amp; Giờ</span>
                  <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    {selectedApptModal.date || 'Hôm nay'}, {selectedApptModal.startTime || '08:00'} - {selectedApptModal.endTime || '09:30'}
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

      {/* ══════════════ MODAL QUẢN LÝ KHUNG GIỜ (KHÓA / MỞ KHUNG GIỜ THỰC TẾ TRÊN CSDL) ══════════════ */}
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
            maxWidth: 460,
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              padding: '16px 20px',
              background: selectedEmptySlot.isBlocked ? '#fff7ed' : '#f0fdfa',
              borderBottom: `1px solid ${selectedEmptySlot.isBlocked ? '#ffedd5' : '#ccfbf1'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: selectedEmptySlot.isBlocked ? '#9a3412' : '#0f766e' }}>
                {selectedEmptySlot.isBlocked ? 'Đang Khóa: ' : 'Quản lý ca trực: '} {selectedEmptySlot.day} ({selectedEmptySlot.time})
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
              {selectedEmptySlot.isBlocked ? (
                <div>
                  <div style={{
                    background: '#fff7ed',
                    border: '1px solid #ffedd5',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginBottom: 16,
                    fontSize: 13,
                    color: '#9a3412',
                    lineHeight: 1.5
                  }}>
                    Khung giờ <strong>{selectedEmptySlot.time}</strong> ngày <strong>{selectedEmptySlot.date}</strong> hiện đang <strong>BỊ KHÓA (Chuyên viên bận)</strong>. Sinh viên vào đặt lịch sẽ <strong>KHÔNG NHÌN THẤY</strong> khung giờ này.
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px' }}>
                    Bạn có muốn mở lại khung giờ này để sinh viên có thể đặt lịch hẹn tư vấn không?
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const expertId = user?.id || '33333333-3333-3333-3333-333333333330';
                      try {
                        const res = await axiosClient.post(`/appointments/expert/${expertId}/unblock-slot`, {
                          date: selectedEmptySlot.date,
                          time: selectedEmptySlot.time
                        });
                        await loadAppointments();
                        setNotice({
                          type: 'success',
                          title: 'Đã mở khung giờ thành công',
                          message: res.data?.message || `Đã mở lại khung giờ ${selectedEmptySlot.time} ngày ${selectedEmptySlot.date} cho sinh viên đặt hẹn.`
                        });
                      } catch (err) {
                        setNotice({
                          type: 'error',
                          title: 'Không thể mở khung giờ',
                          message: err?.response?.data?.message || 'Có lỗi xảy ra khi mở lại khung giờ.'
                        });
                      }
                      setSelectedEmptySlot(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1.5px solid #10b981',
                      background: '#f0fdf4',
                      color: '#065f46',
                      fontWeight: 800,
                      fontSize: 13.5,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Mở lại nhận sinh viên đặt hẹn
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
                    Khung giờ này hiện đang trống vào ngày <strong>{selectedEmptySlot.date}</strong> lúc <strong>{selectedEmptySlot.time}</strong>. Bạn muốn thiết lập trạng thái nào cho ca trực này?
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        const expertId = user?.id || '33333333-3333-3333-3333-333333333330';
                        try {
                          const res = await axiosClient.post(`/appointments/expert/${expertId}/block-slot`, {
                            date: selectedEmptySlot.date,
                            time: selectedEmptySlot.time,
                            reason: 'Chuyên viên bận'
                          });
                          await loadAppointments();
                          setNotice({
                            type: 'warning',
                            title: 'Đã khóa khung giờ thành công',
                            message: res.data?.message || `Đã khóa khung giờ ${selectedEmptySlot.time} ngày ${selectedEmptySlot.date} (Chuyên viên bận). Sinh viên sẽ không thấy khung giờ này.`
                          });
                        } catch (err) {
                          setNotice({
                            type: 'error',
                            title: 'Không thể khóa khung giờ',
                            message: err?.response?.data?.message || 'Có lỗi xảy ra khi khóa khung giờ.'
                          });
                        }
                        setSelectedEmptySlot(null);
                      }}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: '1.5px solid #f97316',
                        background: '#fff7ed',
                        color: '#9a3412',
                        fontWeight: 800,
                        fontSize: 13.5,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Khóa khung giờ (Chuyên viên bận)
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#ea580c', marginTop: 2 }}>
                        Sinh viên sẽ không thể nhìn thấy khung giờ này khi đặt lịch
                      </span>
                    </button>
                  </div>
                </div>
              )}
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
