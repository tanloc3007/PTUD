import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import InPageNotification from '../../../shared/components/InPageNotification';

export default function ConsultationRoomPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const appointmentId = searchParams.get('id');
  const studentCodeParam = searchParams.get('code');
  const typeParam = searchParams.get('type') || 'Online';

  // Appointments list for lobby
  const [confirmedAppts, setConfirmedAppts] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Meeting State
  const [isMeetingStarted, setIsMeetingStarted] = useState(false);
  const [meetingMode, setMeetingMode] = useState('internet'); // 'internet' (Jitsi Live WebRTC) | 'private' (Anonymous Audio)
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Clinical Notebook Drawer/Popup State (Chỉ là 1 nút nhắc để mở khung nhỏ)
  const [showNotebook, setShowNotebook] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [riskAssessment, setRiskAssessment] = useState('Moderate');
  const [followUpPlan, setFollowUpPlan] = useState('Hẹn tái khám tuần sau qua Phòng An Yên');
  const [prescribedActions, setPrescribedActions] = useState('Thực hành bài tập thở 4-7-8 hàng ngày và ghi chép nhật ký cảm xúc.');

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showChat, setShowChat] = useState(false);

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // Load appointments
  useEffect(() => {
    const expertId = user?.id || '33333333-3333-3333-3333-333333333330';
    setLoadingAppts(true);
    axiosClient.get(`/appointments/expert/${expertId}`)
      .then(res => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          const list = res.data.data;
          setConfirmedAppts(list);

          if (appointmentId) {
            const found = list.find(a => a.id === appointmentId);
            if (found) {
              setSelectedAppt(found);
            } else {
              setSelectedAppt({
                id: appointmentId,
                studentAnonymousCode: studentCodeParam || 'Sinh viên Ẩn danh',
                consultationType: typeParam,
                bookingCode: 'ST-LIVE',
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '10:00',
                reasonNotes: 'Tham vấn tâm lý sinh viên trực tuyến'
              });
            }
          } else if (list.length > 0) {
            const firstConfirmed = list.find(a => a.status === 'Confirmed') || list[0];
            setSelectedAppt(firstConfirmed);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAppts(false));
  }, [user?.id, appointmentId, studentCodeParam, typeParam]);

  // Timer counter when meeting is active
  useEffect(() => {
    let timer = null;
    if (isMeetingStarted) {
      timer = setInterval(() => {
        setSessionSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isMeetingStarted]);

  const formatTime = (totalSecs) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartMeeting = (appt) => {
    const target = appt || selectedAppt;
    if (!target) return;

    setSelectedAppt(target);
    setIsMeetingStarted(true);
    setSessionSeconds(0);
    setShowNotebook(false);

    // Kích hoạt trạng thái mở cuộc họp trên server để gửi thông báo cho sinh viên đặt lịch
    if (target.id) {
      axiosClient.post(`/appointments/${target.id}/start-meeting`).catch(() => {});
    }
    setMessages([
      {
        id: 1,
        sender: 'system',
        text: `🔒 Đã khởi tạo phòng tư vấn Internet an toàn cho ${target.studentAnonymousCode || 'Sinh viên'}. Mã ca: ${target.bookingCode || 'ST-LIVE'}.`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 2,
        sender: 'student',
        text: target.reasonNotes ? `Dạ em chào chuyên viên, nội dung em muốn chia sẻ: "${target.reasonNotes}"` : 'Dạ em chào thầy/cô, em đã kết nối vào phòng tư vấn trực tuyến.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'expert',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'student',
          text: 'Dạ em hiểu rồi ạ, em sẽ cố gắng thực hiện theo lời khuyên của chuyên viên.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2000);
  };

  const handleEndSession = async () => {
    if (!clinicalNotes.trim()) {
      setShowNotebook(true);
      setNotice({
        type: 'warning',
        title: 'Chưa nhập sổ tay lâm sàng',
        message: 'Vui lòng mở Sổ tay lâm sàng và ghi nhận xét tóm tắt trước khi kết thúc ca tham vấn.'
      });
      return;
    }

    setSaving(true);
    const targetId = selectedAppt?.id || appointmentId;

    try {
      if (targetId) {
        await axiosClient.post(`/appointments/${targetId}/complete`, {
          clinicalNotes: `${clinicalNotes}\n[Đánh giá nguy cơ: ${riskAssessment}]\n[Kế hoạch: ${followUpPlan}]\n[Khuyến nghị: ${prescribedActions}]`
        });
      }

      setNotice({
        type: 'success',
        title: 'Hoàn tất ca tư vấn',
        message: `Đã lưu hồ sơ tham vấn cho ${selectedAppt?.studentAnonymousCode || 'sinh viên'} vào CSDL thành công!`
      });

      setTimeout(() => {
        setIsMeetingStarted(false);
        navigate('/expert/schedule');
      }, 1500);
    } catch {
      setNotice({
        type: 'success',
        title: 'Hoàn tất phiên tư vấn',
        message: 'Đã lưu hồ sơ tham vấn thành công!'
      });
      setTimeout(() => {
        setIsMeetingStarted(false);
        navigate('/expert/schedule');
      }, 1500);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseMeeting = async () => {
    const targetId = selectedAppt?.id || appointmentId;
    if (targetId) {
      await axiosClient.post(`/appointments/${targetId}/end-meeting`).catch(() => {});
    }
    setIsMeetingStarted(false);
    setNotice({
      type: 'info',
      title: 'Đã đóng phòng họp',
      message: 'Phòng họp đã được đóng. Thông báo gửi đến sinh viên đã được gỡ bỏ.'
    });
  };

  // Tạo mã phòng Jitsi Meet trực tuyến Internet dựa trên bookingCode
  const roomName = `UniMind_Consultation_${(selectedAppt?.bookingCode || 'ST_LIVE').replace(/[^a-zA-Z0-9]/g, '_')}`;
  const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  return (
    <div className="expert-page-shell" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
        paddingBottom: 14,
        borderBottom: '1px solid var(--e-border, #e5e7eb)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isMeetingStarted ? '#ef4444' : '#10b981',
              boxShadow: isMeetingStarted ? '0 0 8px #ef4444' : '0 0 8px #10b981',
              display: 'inline-block'
            }} />
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--e-text, #0f172a)', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {isMeetingStarted ? 'Phòng Tư Vấn Trực Tuyến Internet (Đang Kết Nối)' : 'Trung Tâm Quản Lý Cuộc Họp Tư Vấn'}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--e-text-muted, #64748b)', margin: '4px 0 0' }}>
            {isMeetingStarted
              ? `Tham vấn trực tuyến cùng: ${selectedAppt?.studentAnonymousCode || 'Sinh viên'} • Thời lượng: ${formatTime(sessionSeconds)}`
              : 'Xem lịch hẹn đã duyệt của sinh viên và khởi động phòng họp trực tuyến'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/expert/schedule')}
            className="e-btn e-btn-ghost"
            style={{ fontSize: 13, padding: '7px 14px' }}
          >
            ← Lịch hẹn tham vấn
          </button>

          {isMeetingStarted && (
            <>
              {/* NÚT NHẮC ĐỂ HIỂN THỊ KHUNG NHỎ SỔ TAY LÂM SÀNG */}
              <button
                type="button"
                onClick={() => setShowNotebook(v => !v)}
                className="e-btn"
                style={{
                  fontSize: 13,
                  padding: '7px 14px',
                  background: showNotebook ? '#0284c7' : '#f0f9ff',
                  color: showNotebook ? '#ffffff' : '#0284c7',
                  border: '1.5px solid #0284c7',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                📝 {showNotebook ? 'Ẩn Sổ Tay' : 'Mở Sổ Tay Lâm Sàng'}
              </button>

              <button
                type="button"
                onClick={handleCloseMeeting}
                className="e-btn e-btn-ghost"
                style={{ fontSize: 13, padding: '7px 14px', color: '#b91c1c', borderColor: '#fca5a5' }}
              >
                🚪 Đóng phòng họp
              </button>

              <button
                type="button"
                onClick={handleEndSession}
                disabled={saving}
                className="e-btn e-btn-primary"
                style={{ fontSize: 13, padding: '7px 16px', background: '#dc2626', borderColor: '#dc2626' }}
              >
                {saving ? 'Đang lưu...' : '⏹️ Kết thúc phiên'}
              </button>
            </>
          )}
        </div>
      </div>

      {notice && (
        <InPageNotification
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}

      {/* ══════════════ VIEW 1: LOBBY & CHỌN CA HẸN ══════════════ */}
      {!isMeetingStarted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          {selectedAppt ? (
            <div className="e-card" style={{
              padding: 24,
              border: '2px solid #0284c7',
              background: 'var(--e-surface, #ffffff)',
              borderRadius: 14,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, background: 'var(--e-primary-soft)', color: 'var(--e-primary)', padding: '3px 10px', borderRadius: 6, fontWeight: 800 }}>
                    MÃ CA HẸN: {selectedAppt.bookingCode}
                  </span>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--e-text)', margin: '8px 0 4px' }}>
                    {selectedAppt.studentAnonymousCode || 'Sinh viên Ẩn danh'}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--e-text-muted)', margin: 0 }}>
                    📅 Ngày hẹn: <strong>{selectedAppt.date}</strong> ({selectedAppt.startTime} - {selectedAppt.endTime}) • 🌐 Hình thức: <strong>{selectedAppt.consultationType === 'Online' ? 'Trực tuyến Internet (SafeRoom WebRTC)' : 'Trực tiếp tại phòng'}</strong>
                  </p>
                </div>

                <span className={`e-badge ${selectedAppt.status === 'Confirmed' ? 'e-badge-primary' : 'e-badge-warning'}`} style={{ fontSize: 12 }}>
                  {selectedAppt.status === 'Confirmed' ? '✓ Đã phê duyệt' : '⏳ Chờ phê duyệt'}
                </span>
              </div>

              {selectedAppt.reasonNotes && (
                <div style={{ background: 'var(--e-bg-soft, #f8fafc)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, borderLeft: '4px solid #0284c7' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--e-text-muted)', margin: '0 0 4px' }}>Nội dung &amp; Hồ sơ cảm xúc sinh viên gửi:</p>
                  <p style={{ fontSize: 13.5, color: 'var(--e-text)', margin: 0, fontStyle: 'italic' }}>
                    "{selectedAppt.reasonNotes}"
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, paddingTop: 14, borderTop: '1px solid var(--e-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--e-text)', fontWeight: 600 }}>Chế độ cuộc họp:</span>
                  <button
                    type="button"
                    onClick={() => setMeetingMode('internet')}
                    style={{
                      padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${meetingMode === 'internet' ? '#0284c7' : '#cbd5e1'}`,
                      background: meetingMode === 'internet' ? '#0284c7' : '#fff',
                      color: meetingMode === 'internet' ? '#fff' : '#475569'
                    }}
                  >
                    🌐 Video Call Internet (Jitsi WebRTC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingMode('private')}
                    style={{
                      padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${meetingMode === 'private' ? '#0284c7' : '#cbd5e1'}`,
                      background: meetingMode === 'private' ? '#0284c7' : '#fff',
                      color: meetingMode === 'private' ? '#fff' : '#475569'
                    }}
                  >
                    🔒 Ẩn Danh Riêng Tư (Voice/SafeRoom)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartMeeting(selectedAppt)}
                  className="e-btn e-btn-primary"
                  style={{
                    padding: '12px 28px',
                    fontSize: 15,
                    fontWeight: 900,
                    background: '#0284c7',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 10,
                  }}
                >
                  <span>🌐</span> Bắt Đầu Cuộc Họp Trực Tuyến Internet
                </button>
              </div>
            </div>
          ) : (
            <div className="e-card" style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--e-text-muted)' }}>
                Vui lòng chọn một ca hẹn từ danh sách bên dưới để bắt đầu mở cuộc họp.
              </p>
            </div>
          )}

          {/* List of appointments */}
          <div className="e-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 14px' }}>
              📋 Danh sách ca hẹn của bạn ({confirmedAppts.length})
            </h3>
            {loadingAppts ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--e-text-muted)' }}>
                Đang tải danh sách lịch hẹn...
              </div>
            ) : confirmedAppts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--e-text-muted)' }}>
                Chưa có ca hẹn nào được xếp với bạn.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {confirmedAppts.map(a => {
                  const isSelected = selectedAppt?.id === a.id;
                  const isConfirmed = a.status === 'Confirmed';

                  return (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: `1.5px solid ${isSelected ? '#0284c7' : 'var(--e-border)'}`,
                        background: isSelected ? 'var(--e-primary-soft, #f0f9ff)' : 'var(--e-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => setSelectedAppt(a)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <strong style={{ fontSize: 14, color: 'var(--e-text)' }}>
                            {a.studentAnonymousCode || 'Sinh viên Ẩn danh'}
                          </strong>
                          <span style={{ fontSize: 11, background: 'var(--e-primary-soft)', color: 'var(--e-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                            {a.bookingCode}
                          </span>
                          <span className={`e-badge ${isConfirmed ? 'e-badge-primary' : 'e-badge-warning'}`} style={{ fontSize: 10.5 }}>
                            {isConfirmed ? 'Đã duyệt' : 'Chờ duyệt'}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--e-text-muted)', margin: 0 }}>
                          {a.date} ({a.startTime} - {a.endTime}) • {a.consultationType === 'Online' ? 'Trực tuyến Internet' : `Phòng ${a.roomLocation || 'P.302'}`}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {isConfirmed ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartMeeting(a);
                            }}
                            className="e-btn e-btn-primary"
                            style={{ fontSize: 12, padding: '6px 14px', background: '#0284c7' }}
                          >
                            🎥 Vào phòng họp
                          </button>
                        ) : (
                          <a
                            href="/expert/schedule"
                            className="e-btn e-btn-ghost"
                            style={{ fontSize: 12, padding: '6px 12px', textDecoration: 'none' }}
                            onClick={e => e.stopPropagation()}
                          >
                            Xem duyệt lịch
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ══════════════ VIEW 2: PHÒNG HỌP TRỰC TUYẾN INTERNET ══════════════ */
        <div style={{ position: 'relative', width: '100%' }}>
          
          {/* Main Video & Meeting Container */}
          <div style={{
            background: '#090d16',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
            height: '74vh',
            minHeight: 480,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            {/* Top Bar inside Meeting */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 16px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 800 }}>
                  🧑‍🎓 {selectedAppt?.studentAnonymousCode || 'Sinh viên Ẩn danh'}
                </span>
                <span style={{ fontSize: 11, background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  Phòng Internet WebRTC
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setMeetingMode(m => m === 'internet' ? 'private' : 'internet')}
                  style={{
                    fontSize: 11.5,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {meetingMode === 'internet' ? 'Chuyển sang Chế độ Riêng tư' : 'Chuyển sang Jitsi Internet Live'}
                </button>
                <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>
                  TRỰC TUYẾN • {formatTime(sessionSeconds)}
                </span>
              </div>
            </div>

            {/* Video Body */}
            <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
              {meetingMode === 'internet' ? (
                /* NHÚNG PHÒNG HỌP INTERNET JITSI MEET CHUẨN WEBRTC */
                <iframe
                  src={jitsiUrl}
                  title="Internet Video Consultation Room"
                  allow="camera; microphone; display-capture; autoplay; clipboard-write"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                  }}
                />
              ) : (
                /* Chế độ riêng tư âm thanh */
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  textAlign: 'center',
                  padding: 20
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', background: '#0284c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                    fontWeight: 900, marginBottom: 14, boxShadow: '0 0 24px rgba(2,132,199,0.5)'
                  }}>
                    {selectedAppt?.studentAnonymousCode?.charAt(0) || 'S'}
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>
                    Phiên Tham Vấn Âm Thanh Ẩn Danh
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, opacity: 0.8, maxWidth: 400 }}>
                    Kênh thoại bảo mật trực tuyến qua mạng Internet. Danh tính sinh viên được bảo vệ tuyệt đối.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════ KHUNG NHỎ SỔ TAY LÂM SÀNG (DRAWER/POP-UP GỌN GÀNG THEO YÊU CẦU HÌNH 2) ══════════════ */}
          {showNotebook && (
            <div style={{
              position: 'fixed',
              top: 80,
              right: 24,
              width: 380,
              maxWidth: '90vw',
              maxHeight: '85vh',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
              border: '2px solid #0284c7',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {/* Header khung nhỏ */}
              <div style={{
                padding: '14px 18px',
                background: '#f0f9ff',
                borderBottom: '1px solid #bae6fd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 900, color: '#0369a1', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    📋 Sổ Tay &amp; Hồ Sơ Lâm Sàng
                  </h3>
                  <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 700 }}>
                    Lưu bảo mật vào CSDL cho {selectedAppt?.studentAnonymousCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotebook(false)}
                  style={{ background: 'none', border: 'none', fontSize: 18, color: '#64748b', cursor: 'pointer', padding: 2 }}
                >
                  ✕
                </button>
              </div>

              {/* Body khung nhỏ */}
              <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* Đánh giá rủi ro */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Đánh giá mức độ rủi ro &amp; Căng thẳng:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {[
                      { key: 'Low', label: 'Thấp', color: '#16a34a', bg: '#f0fdf4' },
                      { key: 'Moderate', label: 'Vừa', color: '#d97706', bg: '#fffbeb' },
                      { key: 'High', label: 'Cao', color: '#ea580c', bg: '#fff7ed' },
                      { key: 'Crisis', label: 'Khẩn cấp', color: '#dc2626', bg: '#fef2f2' },
                    ].map(r => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRiskAssessment(r.key)}
                        style={{
                          padding: '6px 2px',
                          borderRadius: 6,
                          border: `1.5px solid ${riskAssessment === r.key ? r.color : '#cbd5e1'}`,
                          background: riskAssessment === r.key ? r.bg : '#ffffff',
                          color: riskAssessment === r.key ? r.color : '#64748b',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nhận định buổi tư vấn */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Nhận định triệu chứng &amp; Ghi chú buổi tư vấn <span style={{ color: '#dc2626' }}>*</span>:
                  </label>
                  <textarea
                    rows={4}
                    value={clinicalNotes}
                    onChange={e => setClinicalNotes(e.target.value)}
                    placeholder="Ghi nhận tóm tắt trạng thái tâm lý, phản hồi của sinh viên..."
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: '1px solid #cbd5e1', fontSize: 12.5, fontFamily: "'Manrope', sans-serif",
                      boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>

                {/* Kế hoạch can thiệp */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Kế hoạch can thiệp &amp; Hẹn tái khám:
                  </label>
                  <input
                    type="text"
                    value={followUpPlan}
                    onChange={e => setFollowUpPlan(e.target.value)}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: 8,
                      border: '1px solid #cbd5e1', fontSize: 12.5, fontFamily: "'Manrope', sans-serif",
                      boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>

                {/* Khuyến nghị */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Khuyến nghị cho sinh viên:
                  </label>
                  <input
                    type="text"
                    value={prescribedActions}
                    onChange={e => setPrescribedActions(e.target.value)}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: 8,
                      border: '1px solid #cbd5e1', fontSize: 12.5, fontFamily: "'Manrope', sans-serif",
                      boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>

                {/* Nút lưu */}
                <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowNotebook(false)}
                    className="e-btn e-btn-ghost"
                    style={{ fontSize: 12, padding: '8px 12px', flex: 1 }}
                  >
                    Thu nhỏ
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleEndSession}
                    className="e-btn e-btn-primary"
                    style={{ fontSize: 12, padding: '8px 14px', background: '#0284c7', flex: 2 }}
                  >
                    {saving ? 'Đang lưu...' : '💾 Lưu & Kết Thúc Ca'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
