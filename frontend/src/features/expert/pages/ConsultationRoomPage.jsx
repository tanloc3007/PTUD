import { useState, useEffect } from 'react';
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
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  // Clinical Notebook
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [riskAssessment, setRiskAssessment] = useState('Moderate');
  const [followUpPlan, setFollowUpPlan] = useState('Hẹn tái khám tuần sau qua Phòng An Yên');
  const [prescribedActions, setPrescribedActions] = useState('Thực hành bài tập thở 4-7-8 hàng ngày và ghi chép nhật ký cảm xúc.');

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
    setMessages([
      {
        id: 1,
        sender: 'system',
        text: `🔒 Đã khởi tạo phòng tư vấn riêng biệt cho ${target.studentAnonymousCode || 'Sinh viên'}. Mã ca: ${target.bookingCode || 'ST-LIVE'}.`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 2,
        sender: 'student',
        text: target.reasonNotes ? `Dạ em chào chuyên viên, nội dung em muốn chia sẻ: "${target.reasonNotes}"` : 'Dạ em chào thầy/cô, em đã vào phòng tư vấn rồi ạ.',
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

    // Simulate student response
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
      setNotice({
        type: 'warning',
        title: 'Chưa nhập sổ tay lâm sàng',
        message: 'Vui lòng ghi nhận xét chuyên môn tóm tắt trước khi hoàn tất phiên tham vấn.'
      });
      return;
    }

    setSaving(true);
    const targetId = selectedAppt?.id || appointmentId;

    try {
      if (targetId) {
        await axiosClient.post(`/appointments/${targetId}/complete`, {
          clinicalNotes: `${clinicalNotes}\n[Đánh giá nguy cơ: ${riskAssessment}]\n[Kế hoạch: ${followUpPlan}]\n[Chỉ định: ${prescribedActions}]`
        });
      }

      setNotice({
        type: 'success',
        title: 'Hoàn tất phiên tư vấn',
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
              {isMeetingStarted ? 'Phòng Tư Vấn Trực Tuyến 1-1 (Đang Diễn Ra)' : 'Trung Tâm Quản Lý Cuộc Họp Tư Vấn'}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--e-text-muted, #64748b)', margin: '4px 0 0' }}>
            {isMeetingStarted
              ? `Đang tham vấn cùng: ${selectedAppt?.studentAnonymousCode || 'Sinh viên'} • Thời lượng: ${formatTime(sessionSeconds)}`
              : 'Xem lịch hẹn đã duyệt của sinh viên và chủ động quyết định khởi động phòng họp'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/expert/schedule')}
            className="e-btn e-btn-ghost"
            style={{ fontSize: 13, padding: '7px 14px' }}
          >
            ← Lịch hẹn tham vấn
          </button>
          {isMeetingStarted && (
            <button
              type="button"
              onClick={handleEndSession}
              disabled={saving}
              className="e-btn e-btn-primary"
              style={{ fontSize: 13, padding: '7px 16px', background: '#dc2626', borderColor: '#dc2626' }}
            >
              {saving ? 'Đang lưu...' : '⏹️ Kết thúc & Lưu sổ tay'}
            </button>
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

      {/* ══════════════ VIEW 1: PRE-MEETING LOBBY & APPOINTMENT SELECTION ══════════════ */}
      {!isMeetingStarted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>

          {/* Selected Appointment Ready Card */}
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
                    📅 Ngày hẹn: <strong>{selectedAppt.date}</strong> ({selectedAppt.startTime} - {selectedAppt.endTime}) • 🌐 Hình thức: <strong>{selectedAppt.consultationType === 'Online' ? 'Trực tuyến (SafeRoom)' : 'Trực tiếp tại phòng'}</strong>
                  </p>
                </div>

                <span className={`e-badge ${selectedAppt.status === 'Confirmed' ? 'e-badge-primary' : 'e-badge-warning'}`} style={{ fontSize: 12 }}>
                  {selectedAppt.status === 'Confirmed' ? '✓ Đã phê duyệt' : '⏳ Chờ phê duyệt'}
                </span>
              </div>

              {selectedAppt.reasonNotes && (
                <div style={{ background: 'var(--e-bg-soft, #f8fafc)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, borderLeft: '4px solid #0284c7' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--e-text-muted)', margin: '0 0 4px' }}>Nội dung sinh viên đăng ký trước:</p>
                  <p style={{ fontSize: 13.5, color: 'var(--e-text)', margin: 0, fontStyle: 'italic' }}>
                    "{selectedAppt.reasonNotes}"
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, paddingTop: 14, borderTop: '1px solid var(--e-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--e-text)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={camOn} onChange={e => setCamOn(e.target.checked)} />
                    Bật Camera trước khi vào
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--e-text)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={micOn} onChange={e => setMicOn(e.target.checked)} />
                    Bật Microphone
                  </label>
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
                  <span>🟢</span> Mở Cuộc Họp &amp; Bắt Đầu Ca Tư Vấn
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

          {/* List of all appointments for this expert */}
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
                          {a.date} ({a.startTime} - {a.endTime}) • {a.consultationType === 'Online' ? 'Trực tuyến (SafeRoom)' : `Phòng ${a.roomLocation || 'P.302'}`}
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
                            🎥 Mở phòng họp
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
        /* ══════════════ VIEW 2: ACTIVE LIVE MEETING WORKSPACE ══════════════ */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 20,
          width: '100%',
        }}>
          {/* Left Column: Live Screen & Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Live Video Box */}
            <div style={{
              background: '#090d16',
              borderRadius: 14,
              overflow: 'hidden',
              position: 'relative',
              aspectRatio: '16/9',
              minHeight: 240,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 16,
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  🧑‍🎓 {selectedAppt?.studentAnonymousCode || 'Sinh viên Ẩn danh'}
                </span>
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.05em',
                }}>
                  TRỰC TUYẾN • {formatTime(sessionSeconds)}
                </span>
              </div>

              <div style={{ textAlign: 'center', margin: 'auto' }}>
                <div style={{
                  width: 76,
                  height: 76,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#fff',
                  fontSize: 28,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  boxShadow: '0 0 24px rgba(2,132,199,0.5)',
                }}>
                  {selectedAppt?.studentAnonymousCode?.charAt(0) || 'S'}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 700, margin: 0 }}>
                  Đang kết nối phiên tư vấn an toàn 1-1
                </p>
              </div>

              {/* Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(10px)',
                padding: '8px 16px',
                borderRadius: 30,
                margin: '0 auto',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <button
                  type="button"
                  onClick={() => setMicOn(v => !v)}
                  style={{
                    background: micOn ? 'rgba(255,255,255,0.15)' : '#ef4444',
                    color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                  }}
                  title={micOn ? 'Tắt Mic' : 'Bật Mic'}
                >
                  {micOn ? '🎙️' : '🔇'}
                </button>
                <button
                  type="button"
                  onClick={() => setCamOn(v => !v)}
                  style={{
                    background: camOn ? 'rgba(255,255,255,0.15)' : '#ef4444',
                    color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                  }}
                  title={camOn ? 'Tắt Cam' : 'Bật Cam'}
                >
                  {camOn ? '📹' : '📷'}
                </button>
                <button
                  type="button"
                  onClick={() => setScreenSharing(v => !v)}
                  style={{
                    background: screenSharing ? '#0284c7' : 'rgba(255,255,255,0.15)',
                    color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15
                  }}
                  title="Chia sẻ màn hình"
                >
                  🖥️
                </button>
              </div>
            </div>

            {/* Chat */}
            <div className="e-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', height: 300 }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--e-text)', margin: '0 0 10px' }}>
                💬 Kênh trao đổi trực tiếp ẩn danh
              </h3>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {messages.map(m => {
                  const isMe = m.sender === 'expert';
                  const isSys = m.sender === 'system';

                  if (isSys) {
                    return (
                      <div key={m.id} style={{ background: 'var(--e-bg-soft)', color: 'var(--e-text-muted)', fontSize: 11.5, padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                        {m.text}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        background: isMe ? '#0284c7' : 'var(--e-surface)',
                        color: isMe ? '#ffffff' : 'var(--e-text)',
                        border: isMe ? 'none' : '1px solid var(--e-border)',
                        borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        padding: '8px 12px',
                        fontSize: 13,
                      }}
                    >
                      <p style={{ margin: 0 }}>{m.text}</p>
                      <span style={{ fontSize: 10, opacity: 0.8, display: 'block', textAlign: 'right', marginTop: 2 }}>{m.time}</span>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Nhập tin nhắn tư vấn..."
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--e-border)', background: 'var(--e-surface)', color: 'var(--e-text)', fontSize: 13, outline: 'none' }}
                />
                <button type="submit" className="e-btn e-btn-primary" style={{ padding: '8px 16px', fontSize: 13, background: '#0284c7' }}>
                  Gửi
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Sổ tay lâm sàng */}
          <div className="e-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--e-text)', margin: '0 0 4px' }}>
                📋 Sổ Tay &amp; Hồ Sơ Lâm Sàng Tham Vấn
              </h2>
              <p style={{ fontSize: 12, color: 'var(--e-text-muted)', margin: 0 }}>
                Ghi chép chuyên môn được lưu trữ bảo mật vào CSDL cho ca hẹn của {selectedAppt?.studentAnonymousCode}
              </p>
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--e-text)', display: 'block', marginBottom: 6 }}>
                Đánh giá mức độ rủi ro &amp; Căng thẳng:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
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
                      padding: '8px 4px',
                      borderRadius: 8,
                      border: `1.5px solid ${riskAssessment === r.key ? r.color : 'var(--e-border)'}`,
                      background: riskAssessment === r.key ? r.bg : 'transparent',
                      color: riskAssessment === r.key ? r.color : 'var(--e-text-muted)',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--e-text)', display: 'block', marginBottom: 6 }}>
                Nhận định triệu chứng &amp; Ghi chú buổi tư vấn: <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                rows={5}
                value={clinicalNotes}
                onChange={e => setClinicalNotes(e.target.value)}
                placeholder="Ghi nhận tóm tắt: Trạng thái cảm xúc, phản ứng của sinh viên với bài tập thở, mức độ phục hồi..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--e-border)',
                  background: 'var(--e-surface)',
                  color: 'var(--e-text)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--e-text)', display: 'block', marginBottom: 6 }}>
                Kế hoạch can thiệp &amp; Hẹn tái khám:
              </label>
              <input
                type="text"
                value={followUpPlan}
                onChange={e => setFollowUpPlan(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--e-border)',
                  background: 'var(--e-surface)',
                  color: 'var(--e-text)',
                  fontSize: 12.5,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--e-text)', display: 'block', marginBottom: 6 }}>
                Khuyến nghị cho sinh viên:
              </label>
              <input
                type="text"
                value={prescribedActions}
                onChange={e => setPrescribedActions(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--e-border)',
                  background: 'var(--e-surface)',
                  color: 'var(--e-text)',
                  fontSize: 12.5,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ paddingTop: 8, borderTop: '1px solid var(--e-border)' }}>
              <button
                type="button"
                onClick={handleEndSession}
                disabled={saving}
                className="e-btn e-btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: 14,
                  fontWeight: 800,
                  background: '#0284c7',
                  borderRadius: 8,
                }}
              >
                {saving ? 'Đang lưu hồ sơ lâm sàng...' : '💾 Lưu Sổ Tay & Kết Thúc Phiên Tham Vấn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
