import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';
import SafeCallMeetingRoom from '../../../shared/components/SafeCallMeetingRoom';

export default function StudentMeetingRoomPage() {
  const { id: appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [forbiddenError, setForbiddenError] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [breathPhase, setBreathPhase] = useState('Hít vào (4s)');
  const [breathCount, setBreathCount] = useState(4);

  // 1. Kiểm tra xác thực quyền truy cập phòng họp (Zero-trust authorization)
  useEffect(() => {
    if (!appointmentId || !user?.id) return;

    setLoading(true);
    axiosClient.get(`/appointments/${appointmentId}/verify-participant?userId=${user.id}`)
      .then(() => {
        setAuthorized(true);
        // Tải thông tin chi tiết ca hẹn
        return axiosClient.get(`/appointments/${appointmentId}`);
      })
      .then(res => {
        if (res.data?.data) {
          setAppointment(res.data.data);
        }
      })
      .catch(err => {
        setAuthorized(false);
        const msg = err.response?.data?.message || 'Bạn không có quyền tham gia phòng tư vấn này.';
        setForbiddenError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [appointmentId, user?.id]);

  // 2. Timer đếm giờ phiên tư vấn
  useEffect(() => {
    if (!authorized) return;
    const interval = setInterval(() => {
      setSessionSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [authorized]);

  // 3. Mini guide bài tập thở 4-7-8 khi mở trợ giúp
  useEffect(() => {
    if (!showHelpDrawer) return;
    const phases = [
      { name: 'Hít sâu bằng mũi...', sec: 4 },
      { name: 'Giữ hơi thở bình tâm...', sec: 7 },
      { name: 'Thở nhẹ bằng miệng...', sec: 8 }
    ];
    let curPhaseIdx = 0;
    let curSec = phases[0].sec;

    const timer = setInterval(() => {
      curSec--;
      if (curSec <= 0) {
        curPhaseIdx = (curPhaseIdx + 1) % phases.length;
        curSec = phases[curPhaseIdx].sec;
        setBreathPhase(phases[curPhaseIdx].name);
      }
      setBreathCount(curSec);
    }, 1000);

    return () => clearInterval(timer);
  }, [showHelpDrawer]);

  const formatTime = (totalSecs) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleLeaveMeeting = () => {
    const confirm = window.confirm('Bạn có chắc chắn muốn rời khỏi phòng tư vấn trực tuyến?');
    if (confirm) {
      navigate('/student/booking');
    }
  };

  // Màn hình đang kiểm tra quyền
  if (loading) {
    return (
      <div style={{
        minHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        borderRadius: 16,
        padding: 40,
        textAlign: 'center',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          width: 56,
          height: 56,
          border: '4px solid #ccfbf1',
          borderTopColor: '#0f766e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 20
        }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
          Đang xác thực phòng tư vấn an toàn...
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, maxWidth: 420 }}>
          Hệ thống đang kiểm tra danh tính và quyền tham gia ca hẹn của bạn để đảm bảo không gian tham vấn được bảo mật tuyệt đối 1-1.
        </p>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Màn hình TỪ CHỐI TRUY CẬP (403 Forbidden)
  if (!authorized) {
    return (
      <div style={{
        minHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        borderRadius: 20,
        padding: '48px 24px',
        textAlign: 'center',
        border: '1.5px solid #fecaca',
        boxShadow: '0 20px 40px -15px rgba(239, 68, 68, 0.12)',
        maxWidth: 620,
        margin: '20px auto'
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          marginBottom: 20,
          border: '2px solid #fca5a5'
        }}>
          🛡️
        </div>
        <span style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#b91c1c',
          background: '#fef2f2',
          padding: '4px 12px',
          borderRadius: 20,
          marginBottom: 10,
          border: '1px solid #fecaca',
          letterSpacing: '0.05em'
        }}>
          BẢO MẬT KHÔNG GIAN RIÊNG TƯ • 403 FORBIDDEN
        </span>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#991b1b', margin: '0 0 10px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Quyền Truy Cập Bị Từ Chối
        </h1>
        <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 480 }}>
          {forbiddenError || 'Bạn không phải là sinh viên của ca hẹn này. Theo nguyên tắc Privacy-by-Design, phiên tham vấn tâm lý là không gian bí mật tuyệt đối giữa chuyên viên và sinh viên đã đặt lịch.'}
        </p>

        <div style={{
          background: '#f8fafc',
          borderRadius: 12,
          padding: '14px 20px',
          border: '1px solid #e2e8f0',
          marginBottom: 28,
          textAlign: 'left',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>
            🔒 Quy tắc an toàn &amp; Bảo mật UniMind WebRTC:
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            <li>Chỉ sinh viên sở hữu ca hẹn mới nhận được thông báo và vào được phòng họp.</li>
            <li>Không một sinh viên nào khác có thể nhìn thấy hoặc truy cập phòng này.</li>
            <li>Công nghệ WebRTC P2P nội bộ: Kết nối trực tiếp giữa trình duyệt của bạn và chuyên viên, không qua trung gian bên thứ 3.</li>
            <li>Dữ liệu cuộc họp không lưu trữ hình ảnh hay âm thanh ra ngoài hệ thống.</li>
          </ul>
        </div>

        <button
          onClick={() => navigate('/student/home')}
          style={{
            padding: '10px 24px',
            background: '#0f766e',
            color: '#fff',
            borderRadius: 10,
            border: 'none',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          ← Quay về Trang chủ Sinh viên
        </button>
      </div>
    );
  }

  const bookingCode = appointment?.bookingCode || 'ST_LIVE';

  return (
    <div style={{ width: '100%', maxWidth: 1360, margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* ══════════════ KHUNG PHÒNG HỌP VIDEO SAFECALL WEBRTC TRỰC TIẾP ══════════════ */}
      <div style={{ position: 'relative', width: '100%' }}>
        <SafeCallMeetingRoom
          appointmentId={appointmentId}
          bookingCode={bookingCode}
          currentUserRole="student"
          currentUserName={user?.anonymousCode || user?.fullName || 'Sinh viên Ẩn danh'}
          peerName={appointment?.expertName || 'Chuyên viên Tâm lý'}
          sessionSeconds={sessionSeconds}
          onLeaveOrEnd={handleLeaveMeeting}
          isHost={false}
          defaultImmersive={true}
          extraHeaderActions={
            <button
              type="button"
              onClick={handleLeaveMeeting}
              title="Rời khỏi phòng tư vấn"
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🚪</span>
              <span>Rời phòng</span>
            </button>
          }
        />

        {/* ══════════════ MINI POPUP HỖ TRỢ HÍT THỞ (DRAWER NỔI BẬT) ══════════════ */}
        {showHelpDrawer && (
          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 320,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(12px)',
            borderRadius: 16,
            padding: 18,
            boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
            border: '2px solid #0f766e',
            zIndex: 10,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 6 }}>
                🌸 Bài Tập Thở 4-7-8
              </span>
              <button
                onClick={() => setShowHelpDrawer(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: '#f0fdfa',
              borderRadius: 12,
              padding: '16px 12px',
              textAlign: 'center',
              border: '1px solid #ccfbf1',
              marginBottom: 12
            }}>
              <div style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: '#0d9488',
                color: '#fff',
                fontSize: 26,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                boxShadow: '0 0 20px rgba(13, 148, 136, 0.4)',
                transition: 'transform 1s ease'
              }}>
                {breathCount}
              </div>
              <strong style={{ fontSize: 14, color: '#0f766e' }}>
                {breathPhase}
              </strong>
            </div>

            <p style={{ fontSize: 11.5, color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
              💡 Giúp giảm nhịp tim và hồi hộp. Hãy thả lỏng cơ mặt và vai, chuyên viên luôn ở đây để lắng nghe bạn một cách cởi mở và an toàn.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
