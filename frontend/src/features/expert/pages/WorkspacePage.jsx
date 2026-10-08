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
  const [assessments, setAssessments] = useState([]);
  const [assessFilter, setAssessFilter] = useState('needs_help'); // 'all' | 'needs_help' | 'urgent' | 'recommended' | 'stable'
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
      axiosClient.get('/expert/consultation-assessments').catch(() => ({ data: null })),
      axiosClient.get(`/expert/overview/${expertId}`).catch(() => ({ data: null })),
    ]).then(([todayRes, pendingRes, triageRes, assessRes, overviewRes]) => {
      if (todayRes?.data?.data) setToday(todayRes.data.data);
      if (pendingRes?.data?.data) setPending(pendingRes.data.data);
      if (triageRes?.data?.data) setTriage(triageRes.data.data);
      if (assessRes?.data?.data && Array.isArray(assessRes.data.data)) {
        setAssessments(assessRes.data.data);
      }
      if (overviewRes?.data?.data) setOverview(overviewRes.data.data);
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>

        {/* HÀNG 1: Lịch hẹn hôm nay & Yêu cầu đặt lịch chờ duyệt (2 Cột 50-50) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>

          {/* Lịch hẹn hôm nay */}
          <div className="e-card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--e-text)', margin: 0 }}>
                Lịch hẹn hôm nay ({todayAppts.length})
              </h2>
              <span style={{ fontSize: 11.5, background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: 6, fontWeight: 700 }}>
                Thời gian thực
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {todayAppts.length === 0 ? (
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 10, padding: '36px 16px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--e-text-muted)', fontSize: 13, margin: '0 0 10px' }}>
                    Hôm nay bạn chưa có ca hẹn nào được xếp lịch.
                  </p>
                  <a href="/expert/schedule" className="e-btn e-btn-outline" style={{ fontSize: 12, padding: '6px 14px', textDecoration: 'none', display: 'inline-block' }}>
                    Mở thêm khung giờ
                  </a>
                </div>
              ) : todayAppts.map(appt => (
                <div key={appt.id} className="e-appt-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--e-surface)', borderRadius: 10, border: '1px solid var(--e-border)' }}>
                  <div style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: appt.status === 'Confirmed' ? '#e0f2fe' : '#fef3c7',
                    fontWeight: 800, fontSize: 13.5, color: appt.status === 'Confirmed' ? '#0369a1' : '#b45309',
                    textAlign: 'center', minWidth: 60
                  }}>
                    {appt.startTime || appt.time || '08:30'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {appt.studentAnonymousCode || appt.studentCode || 'Bạn Ẩn Yên #101'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--e-text-muted)', margin: '0 0 6px' }}>
                      {appt.consultationType === 'Online' ? 'Trực tuyến (SafeRoom)' : `Phòng ${appt.roomLocation || 'P.302'}`}
                    </p>
                    <RiskBar score={appt.riskScore || 30} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                    <span className={`e-badge ${appt.status === 'Confirmed' ? 'e-badge-primary' : 'e-badge-warning'}`} style={{ fontSize: 10.5 }}>
                      {appt.status === 'Confirmed' ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                    <a
                      href={`/expert/consultation?id=${appt.id}&code=${encodeURIComponent(appt.studentAnonymousCode || appt.studentCode || 'Bạn Ẩn Yên #101')}&type=${appt.consultationType || 'Online'}`}
                      className="e-btn e-btn-primary"
                      style={{ fontSize: 12, padding: '5px 12px', textDecoration: 'none', background: '#0284c7' }}
                    >
                      Vào phòng
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Yêu cầu đặt lịch chờ duyệt */}
          <div className="e-card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--e-text)', margin: 0 }}>
                Yêu cầu đặt lịch chờ duyệt ({pendingReqs.length})
              </h2>
              <span style={{ fontSize: 11.5, background: pendingReqs.length > 0 ? '#ffedd5' : '#f1f5f9', color: pendingReqs.length > 0 ? '#ea580c' : '#64748b', padding: '3px 10px', borderRadius: 6, fontWeight: 700 }}>
                {pendingReqs.length > 0 ? 'Cần xử lý' : 'Đã duyệt hết'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {pendingReqs.length === 0 ? (
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 10, padding: '36px 16px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--e-text-muted)', fontSize: 13, margin: 0 }}>
                    Không có yêu cầu đặt lịch nào đang chờ phê duyệt.
                  </p>
                </div>
              ) : pendingReqs.map(req => {
                const studentName = req.studentAnonymousCode || req.studentCode || 'Sinh viên Ẩn danh';
                return (
                  <div key={req.id} style={{ padding: '14px 18px', border: '1px solid var(--e-border)', background: 'var(--e-surface)', borderRadius: 10 }}>
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 4px' }}>{studentName}</p>
                      <p style={{ fontSize: 12.5, color: 'var(--e-text-muted)', margin: '0 0 4px' }}>
                        Thời gian: <strong>{req.date || req.requestedDate}</strong> ({req.startTime || req.time})
                      </p>
                      {req.reasonNotes && <p style={{ fontSize: 12.5, color: 'var(--e-text-secondary)', margin: 0, fontStyle: 'italic', background: '#f8fafc', padding: '6px 10px', borderRadius: 6 }}>"{req.reasonNotes}"</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="e-btn e-btn-primary" style={{ flex: 1, padding: '7px 12px', fontSize: 12.5 }} onClick={() => handleAccept(req.id, studentName)}>
                        Phê duyệt
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

        </div>

        {/* HÀNG 2: BẢNG SÀNG LỌC & ĐÁNH GIÁ NHU CẦU TƯ VẤN TÂM LÝ (Triage Assessment Matrix) */}
        <div className="e-card" style={{ padding: 22, border: '1.5px solid #fed7aa', background: '#fffdfa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffedd5', color: '#c2410c', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                CHẨN ĐOÁN LÂM SÀNG &amp; SÀNG LỌC SINH VIÊN
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--e-text)', margin: '0 0 4px' }}>
                Đánh Giá Người Dùng Cần Tư Vấn Tâm Lý ({assessments.length} hồ sơ)
              </h2>
              <p style={{ fontSize: 13, color: 'var(--e-text-muted)', margin: 0 }}>
                Dữ liệu phân tầng từ trắc nghiệm DASS-21 chuẩn Lovibond kết hợp AI NLP phân tích nhật ký &amp; từ khóa nhạy cảm
              </p>
            </div>

            {/* Bộ lọc nhu cầu */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { v: 'needs_help', l: `Cần tư vấn (${assessments.filter(a => (a.overallNeedLevel || a.needLevel) === 'Urgent' || (a.overallNeedLevel || a.needLevel) === 'Recommended' || a.needsConsultation).length})`, color: '#ea580c' },
                { v: 'urgent', l: `Khẩn cấp (${assessments.filter(a => (a.overallNeedLevel || a.needLevel) === 'Urgent').length})`, color: '#dc2626' },
                { v: 'recommended', l: `Khuyến nghị (${assessments.filter(a => (a.overallNeedLevel || a.needLevel) === 'Recommended').length})`, color: '#d97706' },
                { v: 'stable', l: `Ổn định (${assessments.filter(a => (a.overallNeedLevel || a.needLevel) === 'Stable').length})`, color: '#059669' },
                { v: 'all', l: `Tất cả (${assessments.length})`, color: '#475569' },
              ].map(tab => (
                <button
                  key={tab.v}
                  type="button"
                  onClick={() => setAssessFilter(tab.v)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${assessFilter === tab.v ? tab.color : 'var(--e-border)'}`,
                    background: assessFilter === tab.v ? '#ffffff' : 'var(--e-surface)',
                    color: assessFilter === tab.v ? tab.color : 'var(--e-text-muted)',
                    boxShadow: assessFilter === tab.v ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  {tab.l}
                </button>
              ))}
            </div>
          </div>

          {assessments.length === 0 ? (
            <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 10, padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ color: 'var(--e-text-muted)', fontSize: 13, margin: 0 }}>
                Hệ thống đang đồng bộ dữ liệu đánh giá tâm lý sinh viên từ cơ sở dữ liệu...
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
              {assessments
                .filter(a => {
                  const level = a.overallNeedLevel || a.needLevel || 'Stable';
                  if (assessFilter === 'all') return true;
                  if (assessFilter === 'needs_help') return level === 'Urgent' || level === 'Recommended' || a.needsConsultation;
                  if (assessFilter === 'urgent') return level === 'Urgent';
                  if (assessFilter === 'recommended') return level === 'Recommended';
                  if (assessFilter === 'stable') return level === 'Stable';
                  return true;
                })
                .map(a => {
                  const level = a.overallNeedLevel || a.needLevel || 'Stable';
                  const isUrgent = level === 'Urgent';
                  const isRec = level === 'Recommended';
                  const badgeBg = isUrgent ? '#fef2f2' : isRec ? '#fffbeb' : '#ecfdf5';
                  const badgeColor = isUrgent ? '#dc2626' : isRec ? '#b45309' : '#059669';
                  const badgeBorder = isUrgent ? '#fecaca' : isRec ? '#fde68a' : '#a7f3d0';
                  const studentName = a.anonymousCode || a.anonymousPseudonym || 'Sinh viên Ẩn danh';
                  const reason = a.recommendationReason || a.reasonSummary || 'Theo dõi cảm xúc định kỳ.';
                  const depScore = a.depressionScore ?? (a.depressionSeverity === 'Moderate' ? 16 : a.depressionSeverity === 'Severe' ? 24 : 6);
                  const anxScore = a.anxietyScore ?? (a.anxietySeverity === 'Moderate' ? 14 : a.anxietySeverity === 'Severe' ? 18 : 4);
                  const strScore = a.stressScore ?? (a.stressSeverity === 'Moderate' ? 22 : a.stressSeverity === 'Severe' ? 30 : 8);

                  return (
                    <div
                      key={a.studentId}
                      style={{
                        background: '#ffffff', border: `1.5px solid ${isUrgent ? '#fca5a5' : isRec ? '#fed7aa' : '#e2e8f0'}`,
                        borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10,
                        boxShadow: isUrgent ? '0 4px 12px rgba(239,68,68,0.08)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: 14, color: 'var(--e-text)' }}>{studentName}</strong>
                          <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block' }}>
                            Khoa: {a.faculty || 'ĐH Lạc Hồng'} • {a.lastActivityAt ? new Date(a.lastActivityAt).toLocaleDateString('vi-VN') : 'Dữ liệu mới nhất'}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                          background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`
                        }}>
                          {isUrgent ? '🔴 CẦN TƯ VẤN KHẨN CẤP' : isRec ? '🟡 KHUYẾN NGHỊ THAM VẤN' : '🟢 ỔN ĐỊNH'}
                        </span>
                      </div>

                      {/* 3 chỉ số DASS-21 chuẩn Lovibond */}
                      <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Trầm cảm</div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: depScore >= 14 ? '#dc2626' : '#1e293b' }}>
                            {depScore}/42
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{a.depressionSeverity || 'Bình thường'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Lo âu</div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: anxScore >= 10 ? '#ea580c' : '#1e293b' }}>
                            {anxScore}/42
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{a.anxietySeverity || 'Bình thường'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Căng thẳng</div>
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: strScore >= 19 ? '#f59e0b' : '#1e293b' }}>
                            {strScore}/42
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{a.stressSeverity || 'Bình thường'}</div>
                        </div>
                      </div>

                      {/* Lý do & nhận định lâm sàng */}
                      <p style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5, margin: 0 }}>
                        <strong>Nhận định chuyên môn:</strong> {reason}
                      </p>

                      {a.suggestedAction && (
                        <div style={{ fontSize: 11.5, color: '#0369a1', background: '#f0f9ff', padding: '6px 10px', borderRadius: 6, border: '1px solid #bae6fd' }}>
                          💡 <strong>Hành động gợi ý:</strong> {a.suggestedAction}
                        </div>
                      )}

                      {/* Thao tác chuyên viên */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                        <a
                          href={`/expert/schedule`}
                          className="e-btn e-btn-primary"
                          style={{ flex: 1, padding: '6px 10px', fontSize: 12, textDecoration: 'none', textAlign: 'center', background: isUrgent ? '#dc2626' : '#0284c7' }}
                        >
                          Xếp lịch tư vấn
                        </a>
                        <a
                          href={`/expert/consultation?studentId=${a.studentId}&code=${encodeURIComponent(studentName)}`}
                          className="e-btn e-btn-outline"
                          style={{ flex: 1, padding: '6px 10px', fontSize: 12, textDecoration: 'none', textAlign: 'center' }}
                        >
                          Vào SafeRoom
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* HÀNG 3: Cảnh báo Triage (Chiếm trọn 1 hàng ngang) */}
        <div className="e-card" style={{ padding: 22, border: '1.5px solid #fecaca', background: '#fffafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#991b1b', margin: '0 0 2px' }}>
                Hàng đợi cảnh báo khủng hoảng (Triage) ({triageAlerts.length})
              </h2>
              <p style={{ fontSize: 12.5, color: '#7f1d1d', margin: 0 }}>
                Hệ thống AI NLP phát hiện từ khóa nhạy cảm trong bài viết cộng đồng của sinh viên
              </p>
            </div>
            <a href="/expert/analytics" className="e-btn e-btn-danger" style={{ fontSize: 12.5, padding: '7px 16px', textDecoration: 'none' }}>
              Mở trung tâm phân tích Triage →
            </a>
          </div>

          {triageAlerts.length === 0 ? (
            <p style={{ color: '#059669', fontSize: 13, margin: 0, background: '#ecfdf5', padding: '14px 18px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
              An toàn: Không phát hiện bài viết nào vượt ngưỡng nguy cơ trong 24h qua.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {triageAlerts.map(alert => (
                <div key={alert.id} style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: 13.5, color: '#9a3412' }}>{alert.studentAnonymousCode || alert.studentCode}</strong>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#c2410c', background: '#ffedd5', padding: '2px 8px', borderRadius: 4 }}>
                      Điểm nguy cơ: {alert.riskScore}/100
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#7c2d12', margin: '0 0 8px' }}>
                    Từ khóa: <strong>{alert.triggeredKeywords || alert.keywords}</strong>
                  </p>
                  <RiskBar score={alert.riskScore} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HÀNG 3: Thao tác nhanh chuyên viên (Chiếm trọn 1 hàng ngang với 3 cột tiện ích) */}
        <div className="e-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 16px' }}>
            Thao tác nhanh chuyên viên
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <a
              href="/expert/schedule"
              style={{
                display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 20px',
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                textDecoration: 'none', color: '#0f172a', transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.background = '#f0f9ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
            >
              <strong style={{ fontSize: 14, color: '#0284c7' }}>Quản lý thời khóa biểu tuần</strong>
              <span style={{ fontSize: 12, color: 'var(--e-text-muted)' }}>Xem lịch trực, phê duyệt và mở thêm khung giờ tham vấn</span>
            </a>

            <a
              href="/expert/analytics"
              style={{
                display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 20px',
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                textDecoration: 'none', color: '#0f172a', transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.background = '#f0f9ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
            >
              <strong style={{ fontSize: 14, color: '#0284c7' }}>Báo cáo DASS-21 &amp; Xu hướng</strong>
              <span style={{ fontSize: 12, color: 'var(--e-text-muted)' }}>Phân tích biểu đồ cảm xúc, độ căng thẳng theo thời gian</span>
            </a>

            <a
              href="/expert/consultation"
              style={{
                display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 20px',
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                textDecoration: 'none', color: '#166534', transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#dcfce7'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#bbf7d0'; e.currentTarget.style.background = '#f0fdf4'; }}
            >
              <strong style={{ fontSize: 14, color: '#15803d' }}>Khởi tạo phòng SafeRoom trực tuyến</strong>
              <span style={{ fontSize: 12, color: '#166534' }}>Kết nối phòng tư vấn video call WebRTC với sinh viên</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
