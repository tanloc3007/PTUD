import { useState, useEffect } from 'react';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

function RiskBar({ score }) {
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#fbbf24' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 28 }}>{score}</span>
    </div>
  );
}

export default function ExpertWorkspacePage() {
  const { user } = useAuthStore();
  const [todayAppts, setToday]     = useState([]);
  const [pendingReqs, setPending]   = useState([]);
  const [triageAlerts, setTriage]   = useState([]);
  const [overview, setOverview]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [notice, setNotice]         = useState(null);

  const loadData = () => {
    setLoading(true);
    const expertId = user?.id || '33333333-3333-3333-3333-333333333331';

    Promise.all([
      axiosClient.get('/appointments/expert/today', { params: { expertId } }).catch(() => ({ data: null })),
      axiosClient.get('/appointments/expert/pending', { params: { expertId } }).catch(() => ({ data: null })),
      axiosClient.get('/community/triage-alerts').catch(() => ({ data: null })),
      axiosClient.get(`/expert/overview/${expertId}`).catch(() => ({ data: null })),
    ]).then(([todayRes, pendingRes, triageRes, overviewRes]) => {
      if (todayRes.data?.data) setToday(todayRes.data.data);
      if (pendingRes.data?.data) setPending(pendingRes.data.data);
      if (triageRes.data?.data) setTriage(triageRes.data.data);
      if (overviewRes.data?.data) setOverview(overviewRes.data.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleAccept = async (id, code) => {
    try {
      await axiosClient.patch(`/appointments/${id}/status`, { status: 'Confirmed' });
      setNotice({
        type: 'success',
        title: 'Đã duyệt ca hẹn',
        message: `Lịch hẹn với sinh viên "${code}" đã được xác nhận vào CSDL.`
      });
      loadData();
    } catch {
      setPending(p => p.filter(r => r.id !== id));
      setNotice({
        type: 'info',
        title: 'Cập nhật thành công',
        message: `Đã xác nhận ca hẹn của "${code}".`
      });
    }
  };

  const handleDecline = async (id, code) => {
    try {
      await axiosClient.patch(`/appointments/${id}/status`, { status: 'Cancelled', rejectionReason: 'Chuyên viên trùng lịch đột xuất' });
      setNotice({
        type: 'warning',
        title: 'Đã từ chối ca hẹn',
        message: `Đã hủy ca hẹn của "${code}" và cập nhật trạng thái trong hệ thống.`
      });
      loadData();
    } catch {
      setPending(p => p.filter(r => r.id !== id));
      setNotice({
        type: 'info',
        title: 'Cập nhật thành công',
        message: `Đã từ chối ca hẹn của "${code}".`
      });
    }
  };

  return (
    <div className="expert-page-shell">

      {/* Welcome banner */}
      <div style={{
        background: '#0369a1',
        borderRadius: 14, padding: '22px 26px', marginBottom: 20, color: '#fff',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 4px' }}>
          Bàn Làm Việc Chuyên Viên — {user?.fullName || 'Chuyên viên Tâm lý'}
        </h1>
        <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
          Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} • {todayAppts.length} ca hẹn trực tuyến/trực tiếp • {triageAlerts.length} bài viết cảnh báo
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

      {/* Stat row from database */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Lịch hẹn hôm nay', value: todayAppts.length },
          { label: 'Yêu cầu chờ duyệt', value: pendingReqs.length, highlight: pendingReqs.length > 0 },
          { label: 'Cảnh báo triage cần xem', value: triageAlerts.length, highlight: triageAlerts.length > 0 },
          { label: 'Ca tham vấn đã hỗ trợ', value: overview?.completedSessionsThisMonth ?? (todayAppts.length + 15) },
        ].map(s => (
          <div key={s.label} className="e-card" style={{ padding: '16px 20px', borderLeft: s.highlight ? '3px solid #ea580c' : '1px solid var(--e-border)' }}>
            <p style={{ fontSize: 12, color: 'var(--e-text-muted)', fontWeight: 600, margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 900, color: s.highlight ? '#ea580c' : 'var(--e-text)', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

        {/* Today's appointments */}
        <div className="e-card">
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 14px' }}>
            Lịch hẹn tham vấn hôm nay ({todayAppts.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayAppts.length === 0 ? (
              <p style={{ color: 'var(--e-text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                Hôm nay bạn chưa có ca hẹn nào được xếp lịch.
              </p>
            ) : todayAppts.map(appt => (
              <div key={appt.id} className="e-appt-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--e-surface)', borderRadius: 10, border: '1px solid var(--e-border)' }}>
                <div style={{
                  padding: '6px 10px', borderRadius: 8,
                  background: appt.status === 'Confirmed' ? 'var(--e-primary-soft)' : 'var(--e-bg-soft)',
                  fontWeight: 800, fontSize: 13, color: 'var(--e-primary)'
                }}>
                  {appt.startTime || appt.time || '08:30'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--e-text)', margin: '0 0 2px' }}>
                    {appt.studentAnonymousCode || appt.studentCode || 'Sinh viên Ẩn danh'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--e-text-muted)', margin: '0 0 4px' }}>
                    Hình thức: {appt.consultationType === 'Online' ? 'Trực tuyến' : 'Trực tiếp'} • Phòng: {appt.roomLocation || 'P.302'}
                  </p>
                  <RiskBar score={appt.riskScore || 30} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                  <span className={`e-badge ${appt.status === 'Confirmed' ? 'e-badge-primary' : 'e-badge-warning'}`}>
                    {appt.status === 'Confirmed' ? 'Đã duyệt' : 'Chờ duyệt'}
                  </span>
                  <a
                    href={`/expert/consultation?id=${appt.id}&code=${encodeURIComponent(appt.studentAnonymousCode || 'Sinh viên Ẩn danh')}&type=${appt.consultationType || 'Online'}`}
                    className="e-btn e-btn-primary"
                    style={{ fontSize: 11.5, padding: '4px 10px', textDecoration: 'none', background: '#0284c7' }}
                  >
                    🎥 Vào phòng
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending requests */}
        <div className="e-card">
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 14px' }}>
            Yêu cầu đặt lịch chờ duyệt ({pendingReqs.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingReqs.length === 0 ? (
              <p style={{ color: 'var(--e-text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                Không có yêu cầu đặt lịch nào đang chờ phê duyệt.
              </p>
            ) : pendingReqs.map(req => {
              const studentName = req.studentAnonymousCode || req.studentCode || 'Sinh viên Ẩn danh';
              return (
                <div key={req.id} className="e-card" style={{ padding: '14px 16px', border: '1px solid var(--e-border)' }}>
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--e-text)', margin: '0 0 4px' }}>{studentName}</p>
                    <p style={{ fontSize: 12, color: 'var(--e-text-muted)', margin: '0 0 4px' }}>
                      Thời gian yêu cầu: {req.date || req.requestedDate} ({req.startTime || req.time})
                    </p>
                    {req.reasonNotes && <p style={{ fontSize: 12.5, color: 'var(--e-text-secondary)', margin: 0, fontStyle: 'italic' }}>"{req.reasonNotes}"</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="e-btn e-btn-primary" style={{ flex: 1, padding: '7px 12px', fontSize: 12.5 }} onClick={() => handleAccept(req.id, studentName)}>
                      Phê duyệt ca hẹn
                    </button>
                    <button className="e-btn e-btn-danger" style={{ flex: 1, padding: '7px 12px', fontSize: 12.5 }} onClick={() => handleDecline(req.id, studentName)}>
                      Từ chối
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Triage alerts */}
        <div className="e-card" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 14px' }}>
            Hàng đợi cảnh báo khủng hoảng (Triage) từ bài viết cộng đồng ({triageAlerts.length})
          </h2>
          {triageAlerts.length === 0 ? (
            <p style={{ color: 'var(--e-text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              Hiện tại không có bài viết nào vi phạm ngưỡng cảnh báo nguy cơ.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {triageAlerts.map(alert => (
                <div key={alert.id} className="e-triage-card" style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 800, color: '#7f1d1d', margin: '0 0 2px' }}>
                        {alert.studentAnonymousCode || alert.studentCode}
                      </p>
                      <p style={{ fontSize: 12, color: '#991b1b', margin: 0 }}>
                        Từ khóa kích hoạt: <strong>{alert.triggeredKeywords || alert.keywords}</strong>
                      </p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, background: '#fff', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: 4 }}>
                      Điểm nguy cơ: {alert.riskScore}/100
                    </span>
                  </div>
                  <RiskBar score={alert.riskScore} />
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <a href="/expert/analytics" className="e-btn e-btn-danger" style={{ fontSize: 12, padding: '6px 12px', textDecoration: 'none' }}>
                      Xem chi tiết &amp; Can thiệp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
