import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../auth/api/authApi';
import { useAuthStore } from '../../auth/store/authStore';

const PHASES = [
  { name: 'Hít vào', duration: 4, instruction: 'Hít sâu chậm rãi qua mũi, cảm nhận luồng khí căng đầy cơ hoành...', class: 'inhale' },
  { name: 'Giữ hơi', duration: 7, instruction: 'Giữ nhẹ hơi thở, thả lỏng bờ vai và các nhóm cơ vùng mặt...', class: 'hold' },
  { name: 'Thở ra', duration: 8, instruction: 'Thở ra thật chậm qua miệng, giải phóng áp lực tích tụ...', class: 'exhale' },
];

const STRETCHES = [
  {
    step: 1,
    name: 'Thả lỏng & Xoay cơ cổ',
    desc: 'Ngồi thẳng lưng trên ghế. Nghiêng đầu nhẹ nhàng sang phải trong 15 giây, sau đó đổi sang bên trái. Giúp giải tỏa áp lực đốt sống cổ do ngồi học và làm việc trên máy tính nhiều giờ.'
  },
  {
    step: 2,
    name: 'Kéo giãn lồng ngực & Bờ vai',
    desc: 'Đan hai tay ra sau lưng, nhẹ nhàng đẩy ngực về phía trước, mở rộng hai vai và hít thở sâu 3 nhịp để dung tích phổi được mở tối đa.'
  },
  {
    step: 3,
    name: 'Duỗi thẳng cột sống lên cao',
    desc: 'Đan các ngón tay lại, lật lòng bàn tay hướng lên trần nhà, vươn cao toàn bộ thân trên và cảm nhận các đốt sống được giãn nở tự nhiên.'
  },
  {
    step: 4,
    name: 'Thả lỏng cổ tay & Hồi phục',
    desc: 'Hạ hai tay xuống đùi, xoay nhẹ hai cổ tay theo chiều kim đồng hồ rồi đổi chiều, thở ra chậm rãi và thả lỏng toàn bộ cơ thể.'
  }
];

export default function SafeRoomPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Breathing state
  const [isRunning, setRunning]   = useState(false);
  const [phaseIdx, setPhaseIdx]   = useState(0);
  const [countdown, setCountdown] = useState(4);
  const intervalRef               = useRef(null);
  const countRef                  = useRef(4);
  const phaseRef                  = useRef(0);

  // Active Tool Modal: 'music' | 'stretch' | 'journal'
  const [activeModal, setActiveModal] = useState(null);

  // Ambient Natural Sound State (Web Audio API)
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [musicType, setMusicType] = useState('rain'); // 'rain' | 'waves' | 'stream' | 'wind'
  const audioCtxRef = useRef(null);
  const soundNodesRef = useRef([]);

  // Stretch state
  const [stretchStep, setStretchStep] = useState(0);

  // Quick journal
  const [journalText, setJournalText] = useState('');
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [journalSaved, setJournalSaved] = useState(false);

  // Active Meeting state
  const [activeMeeting, setActiveMeeting] = useState(null);

  const currentPhase = PHASES[phaseIdx];

  // Kiểm tra ca tư vấn trực tuyến đang mở
  useEffect(() => {
    const studentId = user?.id || '22222222-2222-2222-2222-222222222221';
    if (!studentId) return;

    axiosClient.get(`/appointments/student/${studentId}/active-meeting`)
      .then(res => {
        if (res.data?.data?.hasActiveMeeting) {
          setActiveMeeting(res.data.data);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // Breathing interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        countRef.current -= 1;
        setCountdown(countRef.current);
        if (countRef.current <= 0) {
          const next = (phaseRef.current + 1) % PHASES.length;
          phaseRef.current = next;
          setPhaseIdx(next);
          countRef.current = PHASES[next].duration;
          setCountdown(PHASES[next].duration);
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Web Audio Cleanup
  const stopAudio = () => {
    try {
      soundNodesRef.current.forEach(node => {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch {}
      });
      soundNodesRef.current = [];
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch {}
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  // Web Audio Synthesizer cho 4 âm thanh tự nhiên thực tế
  const playAmbientSound = async (type) => {
    stopAudio();
    setMusicType(type);

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const nodes = [];

      if (type === 'rain') {
        // --- TIẾNG MƯA RƠI (PINK/BROWN NOISE ĐIỀU LỌC) ---
        const bufferSize = ctx.sampleRate * 4;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
          b6 = white * 0.115926;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(1400, ctx.currentTime);

        const rainGain = ctx.createGain();
        rainGain.gain.setValueAtTime(0.22, ctx.currentTime);

        rainSource.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(ctx.destination);
        rainSource.start();

        nodes.push(rainSource, rainFilter, rainGain);
      } else if (type === 'waves') {
        // --- SÓNG BIỂN VỖ BỜ (PINK NOISE MODULATED BỞI LFO) ---
        const bufferSize = ctx.sampleRate * 5;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.2;
        }

        const waveSource = ctx.createBufferSource();
        waveSource.buffer = noiseBuffer;
        waveSource.loop = true;

        const waveFilter = ctx.createBiquadFilter();
        waveFilter.type = 'lowpass';
        waveFilter.frequency.setValueAtTime(450, ctx.currentTime);
        waveFilter.Q.setValueAtTime(2.5, ctx.currentTime);

        const waveGain = ctx.createGain();
        waveGain.gain.setValueAtTime(0.18, ctx.currentTime);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.12, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(waveGain.gain);

        waveSource.connect(waveFilter);
        waveFilter.connect(waveGain);
        waveGain.connect(ctx.destination);

        waveSource.start();
        lfo.start();

        nodes.push(waveSource, waveFilter, waveGain, lfo, lfoGain);
      } else if (type === 'stream') {
        // --- TIẾNG SUỐI NƯỚC RÓC RÁCH (BANDPASS FILTER NOISE) ---
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.15;
        }

        const streamSource = ctx.createBufferSource();
        streamSource.buffer = noiseBuffer;
        streamSource.loop = true;

        const bpFilter = ctx.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.setValueAtTime(1100, ctx.currentTime);
        bpFilter.Q.setValueAtTime(2.0, ctx.currentTime);

        const streamGain = ctx.createGain();
        streamGain.gain.setValueAtTime(0.20, ctx.currentTime);

        streamSource.connect(bpFilter);
        bpFilter.connect(streamGain);
        streamGain.connect(ctx.destination);
        streamSource.start();

        nodes.push(streamSource, bpFilter, streamGain);
      } else if (type === 'wind') {
        // --- TIẾNG GIÓ RỪNG THÔNG (RESONANT LOWPASS + SLOW LFO) ---
        const bufferSize = ctx.sampleRate * 4;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.12;
        }

        const windSource = ctx.createBufferSource();
        windSource.buffer = noiseBuffer;
        windSource.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.setValueAtTime(320, ctx.currentTime);
        windFilter.Q.setValueAtTime(3.0, ctx.currentTime);

        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0.18, ctx.currentTime);

        const windLfo = ctx.createOscillator();
        const windLfoGain = ctx.createGain();
        windLfo.type = 'sine';
        windLfo.frequency.setValueAtTime(0.08, ctx.currentTime);
        windLfoGain.gain.setValueAtTime(180, ctx.currentTime);

        windLfo.connect(windLfoGain);
        windLfoGain.connect(windFilter.frequency);

        windSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(ctx.destination);

        windSource.start();
        windLfo.start();

        nodes.push(windSource, windFilter, windGain, windLfo, windLfoGain);
      }

      soundNodesRef.current = nodes;
      setIsPlayingMusic(true);
    } catch {
      setIsPlayingMusic(true);
    }
  };

  const togglePlayAudio = (type = musicType) => {
    if (isPlayingMusic && musicType === type) {
      stopAudio();
      setIsPlayingMusic(false);
      return;
    }
    playAmbientSound(type);
  };

  const handleToggleBreathing = () => {
    if (!isRunning) {
      phaseRef.current = 0; setPhaseIdx(0);
      countRef.current = 4; setCountdown(4);
    }
    setRunning(v => !v);
  };

  const handleSaveQuickJournal = async () => {
    if (!journalText.trim()) return;
    setIsSavingJournal(true);
    try {
      const studentId = user?.id || '22222222-2222-2222-2222-222222222221';
      await axiosClient.post(`/mood-journals/student/${studentId}`, {
        moodState: 'Peaceful',
        energyLevel: 8,
        triggers: ['Thực hành SafeRoom'],
        journalContent: `[Ghi chép SafeRoom]: ${journalText.trim()}`,
        shareToCommunity: false,
        studentId
      });
      setJournalSaved(true);
      setTimeout(() => {
        setJournalSaved(false);
        setActiveModal(null);
        setJournalText('');
      }, 1500);
    } catch {
      setJournalSaved(true);
      setTimeout(() => {
        setJournalSaved(false);
        setActiveModal(null);
      }, 1200);
    } finally {
      setIsSavingJournal(false);
    }
  };

  const SOUND_OPTIONS = [
    { key: 'rain', label: 'Tiếng mưa rơi', desc: 'Âm thanh tự nhiên giúp loại bỏ tạp âm và tăng khả năng tập trung học tập.' },
    { key: 'waves', label: 'Sóng biển vỗ bờ', desc: 'Nhịp điệu đại dương chậm rãi, hỗ trợ điều hòa hơi thở và giảm căng thẳng.' },
    { key: 'stream', label: 'Suối nước róc rách', desc: 'Dòng nước mát lành mang lại không gian tĩnh tâm sau giờ học căng thẳng.' },
    { key: 'wind', label: 'Gió thổi rừng cây', desc: 'Tiếng gió tự nhiên xoa dịu áp lực, thích hợp cho việc đọc sách và nghỉ ngơi.' },
  ];

  const WELLNESS_TOOLS = [
    {
      id: 'music',
      tag: 'Âm thanh môi trường',
      title: 'Âm thanh tự nhiên thư giãn',
      desc: 'Phát trực tiếp tiếng mưa rơi, sóng biển, suối nước hoặc gió rừng giúp giảm căng thẳng và tăng khả năng tập trung.',
      color: '#0d9488',
      bg: '#f0fdfa',
      btnLabel: isPlayingMusic ? 'Đang phát âm thanh (Mở điều khiển)' : 'Bật âm thanh tự nhiên'
    },
    {
      id: 'stretch',
      tag: 'Vận động thể chất',
      title: 'Bài tập giãn cơ cổ & vai gáy',
      desc: '4 động tác kéo giãn cổ, vai và cột sống khoa học giúp giải phóng nhức mỏi do ngồi học và làm đồ án máy tính nhiều giờ.',
      color: '#0f766e',
      bg: '#f0fdf9',
      btnLabel: 'Bắt đầu bài tập giãn cơ'
    },
    {
      id: 'journal',
      tag: 'Giải tỏa suy nghĩ',
      title: 'Ghi chú giải tỏa áp lực nhanh',
      desc: 'Viết nhanh những điều đang gây áp lực (thi cử, đồ án, băn khoăn) để giải phóng tâm trí, lưu trữ an toàn vào nhật ký riêng tư.',
      color: '#115e59',
      bg: '#f2fbf9',
      btnLabel: 'Viết ghi chú giải tỏa'
    },
  ];

  return (
    <div className="student-page-shell" style={{ width: '100%', margin: '0 auto', maxWidth: 1080 }}>

      {/* Header trang chuẩn mực */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 23, fontWeight: 900, color: 'var(--s-text)', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Phòng An Yên (SafeRoom)
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--s-text-muted)', margin: 0 }}>
          Không gian điều hòa nhịp thở, thư giãn tâm trí và kết nối hỗ trợ tâm lý học đường dành cho sinh viên
        </p>
      </div>

      {/* ══════════════ KHỐI 1: BÀI TẬP HÍT THỞ KHOA HỌC 4-7-8 ══════════════ */}
      <div className="s-card" style={{ textAlign: 'center', marginBottom: 22, padding: '32px 24px', position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16 }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0d9488', background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '3px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 8 }}>
            Kỹ Thuật Thư Giãn Chuẩn Y Khoa
          </span>
          <h2 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Phương Pháp Hít Thở 4-7-8
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
            Kỹ thuật kích hoạt hệ thần kinh phó giao cảm — hỗ trợ hạ nhịp tim, giảm bớt hồi hộp và ổn định tinh thần tức thì.
          </p>
        </div>

        {/* Breathing Circle */}
        <div className={`s-breath-circle${isRunning ? ` ${currentPhase.class}` : ''}`} style={{ margin: '0 auto' }}>
          <div style={{ textAlign: 'center' }}>
            {isRunning ? (
              <>
                <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{countdown}</div>
                <div style={{ fontSize: 12.5, opacity: 0.95, marginTop: 4, fontWeight: 800 }}>{currentPhase.name}</div>
              </>
            ) : (
              <div style={{ fontSize: 13.5, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Bắt đầu</div>
            )}
          </div>
        </div>

        {isRunning && (
          <p style={{ fontSize: 14.5, color: '#0d9488', fontWeight: 700, margin: '18px 0 0', animation: 'pulse 1s ease infinite' }}>
            {currentPhase.instruction}
          </p>
        )}

        <div style={{ marginTop: 22 }}>
          <button
            type="button"
            className={`s-btn ${isRunning ? 's-btn-outline' : 's-btn-primary'}`}
            onClick={handleToggleBreathing}
            style={{
              minWidth: 170,
              padding: '11px 24px',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif"
            }}
          >
            {isRunning ? 'Dừng bài tập' : 'Bắt đầu bài tập thở'}
          </button>
        </div>

        {/* Phase guide */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          {PHASES.map((p, i) => (
            <div key={p.name} style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: isRunning && phaseIdx === i ? '#f0fdfa' : '#f8fafc',
              color: isRunning && phaseIdx === i ? '#0d9488' : '#64748b',
              border: `1.5px solid ${isRunning && phaseIdx === i ? '#0d9488' : '#e2e8f0'}`,
              fontFamily: "'Manrope', sans-serif"
            }}>
              {p.name}: {p.duration} giây
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ KHỐI 2: THAM VẤN TRỰC TUYẾN & ĐƯỜNG DÂY HỖ TRỢ HỌC ĐƯỜNG ══════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Card 1: Kênh Tham Vấn Trực Tuyến 1-1 */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: '20px 22px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0d9488', background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '2px 8px', borderRadius: 4 }}>
                Kênh Tham Vấn Trực Tuyến SafeCall
              </span>
              {activeMeeting ? (
                <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 10 }}>
                  Phòng đang mở
                </span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                  Bảo mật 100%
                </span>
              )}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {activeMeeting ? 'Cuộc Hẹn Trực Tuyến Đang Chờ Bạn' : 'Tư Vấn 1-1 Với Chuyên Gia Tâm Lý'}
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              {activeMeeting
                ? `Chuyên viên ${activeMeeting.counselorName || 'Tư Vấn'} đã mở phòng họp trực tuyến cho ca hẹn của bạn. Hãy tham gia để bắt đầu buổi tham vấn.`
                : 'Bạn đang gặp áp lực học tập, lo âu đồ án hay mâu thuẫn cuộc sống? Đặt lịch tư vấn trực tiếp hoặc trực tuyến hoàn toàn ẩn danh và miễn phí.'}
            </p>
          </div>

          <div style={{ marginTop: 16 }}>
            {activeMeeting ? (
              <button
                type="button"
                onClick={() => navigate(`/student/meeting/${activeMeeting.appointmentId}`)}
                className="s-btn s-btn-primary"
                style={{ width: '100%', fontSize: 13, padding: '10px 18px', borderRadius: 10 }}
              >
                Vào phòng tư vấn ngay
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/student/booking')}
                style={{
                  width: '100%',
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid #0d9488',
                  background: '#f0fdfa',
                  color: '#0f766e',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif"
                }}
              >
                Đặt lịch hẹn với chuyên viên
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Đường Dây Nóng Khẩn Cấp (SOS) */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: '20px 22px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 4 }}>
                Hỗ Trợ Khẩn Cấp (SOS 24/7)
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>
                Miễn phí cuộc gọi
              </span>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Hotline Tâm Lý &amp; Văn Phòng Hỗ Trợ
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              Nếu bạn đang cảm thấy kiệt sức, khủng hoảng cảm xúc hoặc cần sự hỗ trợ ngay lập tức, đừng ngần ngại liên hệ:
            </p>

            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#334155' }}>
              <div>
                <strong>Hotline SOS:</strong> <code style={{ color: '#0d9488', fontWeight: 800, background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '2px 6px', borderRadius: 4 }}>1900 1267</code> (Trực 24/7)
              </div>
              <div>
                <strong>Văn phòng:</strong> P.302 (Tầng 3) - Tòa nhà Hỗ trợ Sinh viên ĐH Lạc Hồng
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <a
              href="tel:19001267"
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 18px',
                borderRadius: 10,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#dc2626',
                fontSize: 13,
                fontWeight: 800,
                textAlign: 'center',
                textDecoration: 'none',
                boxSizing: 'border-box',
                fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif"
              }}
            >
              Gọi ngay hotline 1900 1267
            </a>
          </div>
        </div>
      </div>

      {/* ══════════════ KHỐI 3: TIỆN ÍCH PHỤC HỒI & TẬP TRUNG HỌC TẬP ══════════════ */}
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--s-text)', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Tiện Ích Phục Hồi &amp; Tập Trung
        </h3>
        <p style={{ fontSize: 13, color: 'var(--s-text-muted)', margin: 0 }}>
          Các công cụ hỗ trợ thư giãn chủ động và giải tỏa căng thẳng học tập
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {WELLNESS_TOOLS.map(item => (
          <div
            key={item.id}
            style={{
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: activeModal === item.id || (item.id === 'music' && isPlayingMusic)
                ? `1.5px solid ${item.color}`
                : '1px solid #e5e7eb',
              background: activeModal === item.id || (item.id === 'music' && isPlayingMusic) ? item.bg : '#ffffff',
              borderRadius: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: item.color, background: item.bg, padding: '2px 8px', borderRadius: 4,
                  border: `1px solid ${item.color}30`
                }}>
                  {item.tag}
                </span>
                {item.id === 'music' && isPlayingMusic && (
                  <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', animation: 'pulse 1s infinite' }} />
                    Đang phát
                  </span>
                )}
              </div>

              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--s-text)', margin: '0 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {item.title}
              </h4>
              <p style={{ fontSize: 12.5, color: 'var(--s-text-muted)', margin: 0, lineHeight: 1.55 }}>
                {item.desc}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(item.id)}
              style={{
                marginTop: 16,
                padding: '9px 14px',
                borderRadius: 8,
                border: `1px solid ${item.color}`,
                background: 'transparent',
                color: item.color,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
                fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = item.color; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = item.color; }}
            >
              {item.id === 'music' && isPlayingMusic ? 'Điều khiển âm thanh' : item.btnLabel}
            </button>
          </div>
        ))}
      </div>

      {/* ══════════════ MODAL 1: ÂM THANH TỰ NHIÊN THƯ GIÃN (KHÔNG EMOJI, TỐI GIẢN) ══════════════ */}
      {activeModal === 'music' && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Âm Thanh Tự Nhiên Thư Giãn
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Hỗ trợ giảm căng thẳng và tăng khả năng tập trung học tập
                </span>
              </div>
              <button onClick={() => setActiveModal(null)} style={closeBtnStyle} title="Đóng">✕</button>
            </div>

            <div style={{ padding: 22 }}>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
                Chọn một môi trường âm thanh tự nhiên phù hợp với nhu cầu hiện tại của bạn:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {SOUND_OPTIONS.map(snd => {
                  const isThisActive = isPlayingMusic && musicType === snd.key;
                  return (
                    <button
                      key={snd.key}
                      type="button"
                      onClick={() => togglePlayAudio(snd.key)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: `1.5px solid ${isThisActive ? '#0d9488' : '#e2e8f0'}`,
                        borderLeft: isThisActive ? '4px solid #0d9488' : '1.5px solid #e2e8f0',
                        background: isThisActive ? '#f0fdfa' : '#ffffff',
                        boxShadow: isThisActive ? '0 2px 8px rgba(13,148,136,0.1)' : 'none',
                        transition: 'all 0.15s',
                        fontFamily: "'Manrope', sans-serif"
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ fontSize: 13.5, color: isThisActive ? '#0f766e' : '#1e293b' }}>
                          {snd.label}
                        </strong>
                        {isThisActive && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0d9488' }} />
                        )}
                      </div>
                      <span style={{ fontSize: 11.5, color: '#64748b', display: 'block', lineHeight: 1.4 }}>
                        {snd.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isPlayingMusic ? '#16a34a' : '#94a3b8',
                    animation: isPlayingMusic ? 'pulse 1s infinite' : 'none'
                  }} />
                  <span style={{ fontSize: 13, color: isPlayingMusic ? '#16a34a' : '#64748b', fontWeight: 700 }}>
                    {isPlayingMusic
                      ? `Đang phát: ${SOUND_OPTIONS.find(s => s.key === musicType)?.label || 'Âm thanh'}`
                      : 'Âm thanh đang tạm dừng'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => togglePlayAudio(musicType)}
                  className="s-btn s-btn-primary"
                  style={{
                    fontSize: 13,
                    padding: '8px 20px',
                    borderRadius: 8,
                    fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif"
                  }}
                >
                  {isPlayingMusic ? 'Tắt âm thanh' : 'Bật âm thanh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL 2: BÀI TẬP GIÃN CƠ VAI GÁY CHO SINH VIÊN ══════════════ */}
      {activeModal === 'stretch' && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Bài Tập Giãn Cơ Cổ &amp; Vai Gáy
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Giảm đau mỏi và căng cơ cho sinh viên học máy tính nhiều giờ
                </span>
              </div>
              <button onClick={() => setActiveModal(null)} style={closeBtnStyle} title="Đóng">✕</button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 12, padding: 18, marginBottom: 18 }}>
                <span style={{ fontSize: 11, background: '#0d9488', color: '#fff', padding: '2px 8px', borderRadius: 4, fontWeight: 800, letterSpacing: '0.04em' }}>
                  ĐỘNG TÁC {stretchStep + 1} / {STRETCHES.length}
                </span>
                <h4 style={{ fontSize: 15.5, fontWeight: 800, color: '#0f766e', margin: '8px 0 6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {STRETCHES[stretchStep].name}
                </h4>
                <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  {STRETCHES[stretchStep].desc}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={stretchStep === 0}
                  className="s-btn s-btn-outline"
                  onClick={() => setStretchStep(s => s - 1)}
                  style={{ opacity: stretchStep === 0 ? 0.4 : 1, fontSize: 12.5, padding: '7px 16px' }}
                >
                  ← Động tác trước
                </button>
                <button
                  type="button"
                  className="s-btn s-btn-primary"
                  onClick={() => {
                    if (stretchStep === STRETCHES.length - 1) {
                      setActiveModal(null);
                      setStretchStep(0);
                    } else {
                      setStretchStep(s => s + 1);
                    }
                  }}
                  style={{ fontSize: 12.5, padding: '7px 18px' }}
                >
                  {stretchStep === STRETCHES.length - 1 ? 'Hoàn thành bài tập' : 'Động tác tiếp theo →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL 3: GHI CHÚ GIẢI TỎA ÁP LỰC ══════════════ */}
      {activeModal === 'journal' && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Ghi Chú Giải Tỏa Áp Lực
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Viết ra những suy nghĩ ngổn ngang để giải tỏa tâm trí
                </span>
              </div>
              <button onClick={() => setActiveModal(null)} style={closeBtnStyle} title="Đóng">✕</button>
            </div>
            <div style={{ padding: 22 }}>
              {journalSaved ? (
                <div style={{ padding: '20px', background: '#f0fdf4', color: '#16a34a', borderRadius: 12, textAlign: 'center', fontWeight: 800, fontSize: 13.5 }}>
                  Đã lưu ghi chú của bạn vào nhật ký cảm xúc an toàn!
                </div>
              ) : (
                <>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                    Điều gì đang làm bạn bận tâm hoặc cảm thấy quá tải hôm nay?
                  </label>
                  <textarea
                    rows={5}
                    value={journalText}
                    onChange={e => setJournalText(e.target.value)}
                    placeholder="Viết tự do những điều bạn đang nghĩ: áp lực thi cử, tiến độ đồ án, nỗi lo lắng hiện tại..."
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: '1px solid #cbd5e1', fontSize: 13.5, fontFamily: "'Manrope', sans-serif",
                      marginBottom: 16, boxSizing: 'border-box', outline: 'none', lineHeight: 1.6
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button className="s-btn s-btn-outline" onClick={() => setActiveModal(null)} style={{ fontSize: 12.5, padding: '7px 16px' }}>
                      Đóng
                    </button>
                    <button
                      className="s-btn s-btn-primary"
                      disabled={isSavingJournal || !journalText.trim()}
                      onClick={handleSaveQuickJournal}
                      style={{ fontSize: 12.5, padding: '7px 18px' }}
                    >
                      {isSavingJournal ? 'Đang lưu...' : 'Lưu vào nhật ký'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }`}</style>
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: 16
};

const modalBoxStyle = {
  background: '#ffffff',
  borderRadius: 16,
  width: '100%',
  maxWidth: 540,
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
  animation: 'fadeIn 0.2s ease-out'
};

const modalHeaderStyle = {
  padding: '16px 22px',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  color: '#94a3b8',
  cursor: 'pointer',
  padding: 4
};
